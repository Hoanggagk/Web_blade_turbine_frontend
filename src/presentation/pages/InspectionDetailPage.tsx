import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/sidebar";
import Button from "../components/button";
import "../styles/ImageListPage.css";
import { inspectionService } from "../../infrastructure/http/auth/inspectionService";
import { withApiBase } from "../../shared/config/env";

const PAGE_SIZE = 24;
const CACHE_BUST = () => Date.now().toString();
const ANALYZE_CONCURRENCY = 4;
const RESULTS_POLL_INTERVAL = 7000;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;

// ====== Helper Types & Utilities ====================================================

/**
 * Bounding box information returned by the API.
 */
export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  confidence?: number;
  damage_grade?: number;
};

/**
 * Assessment entry per image.
 */
export type Assessment = {
  damage_grade?: number;
  ai_bounding_boxes: BBox[];
  ai_damage_types?: string[];
  ai_confidence: number;
  grade_label?: string;
  grade_color?: string;
};

/**
 * Image item belonging to an inspection.
 */
export type ImageItem = {
  id: string;
  file_name: string;
  blade: string;
  surface: string;
  status: string;
  file_url: string;
  assessments?: Assessment[];
};

/**
 * Inspection detail response shape.
 */
export type InspectionDetail = {
  inspection: {
    id: string;
    turbine_id: string;
    status: string;
    total_images: number;
    processed_images: number;
  };
  images: ImageItem[];
};

/**
 * Results item returned by the /results endpoint.
 */
export type ResultsItem = { image_id: string; assessments: Assessment[] };

type DrawnBox = {
  box: BBox;
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  label: string;
};

/**
 * Normalises and returns a colour per detected type.
 */
const getColorByType = (type?: string) => {
  const t = (type || "").trim().toLowerCase();
  switch (t) {
    case "lv_1":
      return "#22c55e";
    case "lv_2":
      return "#16a34a";
    case "lv_3":
      return "#facc15";
    case "lv_4":
      return "#f97316";
    case "lv_5":
      return "#ef4444";
    default:
      return "#8b5cf6";
  }
};

const GRADE_COLOR_CLASS_MAP: Record<string, string> = {
  "#22c55e": "lv-1",
  "#16a34a": "lv-2",
  "#facc15": "lv-3",
  "#f97316": "lv-4",
  "#ef4444": "lv-5",
  "#8b5cf6": "default",
};

const resolveGradeTone = (color?: string, type?: string) => {
  const normalizedColor = (color || "").trim().toLowerCase();
  if (normalizedColor && GRADE_COLOR_CLASS_MAP[normalizedColor]) {
    return GRADE_COLOR_CLASS_MAP[normalizedColor];
  }
  const normalizedType = (type || "").trim().toLowerCase();
  if (normalizedType.startsWith("lv_")) {
    return normalizedType.replace("lv_", "lv-");
  }
  return "default";
};

/**
 * Determines whether an image already has analysis.
 */
const hasAIResult = (img: ImageItem) =>
  img.assessments?.some((a) => (a.ai_bounding_boxes?.length || 0) > 0) ?? false;

/**
 * Determines whether the supplied status marks an image as analysed.
 */
const isAnalyzed = (status?: string) => {
  const s = (status || "").toLowerCase();
  return ["analyzed", "processed", "done", "completed", "ready"].includes(s);
};

/**
 * Checks if an image carries severe damage (LV_4 or LV_5).
 */
const hasSevereDamage = (img: ImageItem) =>
  img.assessments?.some((assessment) =>
    (assessment.ai_bounding_boxes ?? []).some((box) => {
      const type = (box.type || "").toLowerCase();
      return type === "lv_4" || type === "lv_5";
    }),
  ) ?? false;

/**
 * Generates a compact signature for result payloads to avoid redundant state updates.
 */
const formatResultsSignature = (items?: ResultsItem[]) => {
  if (!items) return null;
  return JSON.stringify(
    items.map((item) => ({
      id: item.image_id,
      assessments: (item.assessments || []).map((assessment) => ({
        confidence: assessment.ai_confidence ?? 0,
        boxes: assessment.ai_bounding_boxes?.length ?? 0,
      })),
    })),
  );
};

/**
 * Triggers a JSON download for arbitrary data.
 */
const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Debounces a value by a given delay.
 */
function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setV(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);
  return v;
}

// ====== Component ===================================================================

const InspectionDetailPage: React.FC = () => {
  const { turbineId, inspectionId } =
    useParams<{ turbineId: string; inspectionId: string }>();

  // ----- State ----------------------------------------------------------------------
  const [detail, setDetail] = useState<InspectionDetail | null>(null);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [perImageAnalyzing, setPerImageAnalyzing] = useState<
    Record<string, boolean>
  >({});
  const [imageVersionBump, setImageVersionBump] = useState<
    Record<string, number>
  >({});

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounced(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [bladeFilter, setBladeFilter] = useState<string>("all");
  const [listGradeFilter, setListGradeFilter] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [bboxData, setBboxData] = useState<BBox[] | null>(null);
  const [assessmentInfo, setAssessmentInfo] = useState<Assessment | null>(null);
  const [loadingBbox, setLoadingBbox] = useState(false);
  const [selectedBox, setSelectedBox] = useState<BBox | null>(null);
  const [hoveredBox, setHoveredBox] = useState<BBox | null>(null);
  const [showBBox, setShowBBox] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [imageLoading, setImageLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [analysisBannerVisible, setAnalysisBannerVisible] = useState(false);

  // ----- Refs -----------------------------------------------------------------------
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgMetrics, setImgMetrics] = useState({
    renderedWidth: 0,
    renderedHeight: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const scrollYBeforeModal = useRef<number>(0);
  const analyzeAllTimeoutRef = useRef<number | null>(null);
  const analysisBannerTimeoutRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestBoxesRef = useRef<DrawnBox[]>([]);
  const resultsSignatureRef = useRef<string | null>(null);
  const cacheBustRef = useRef<string>(CACHE_BUST());

  // ----- Derived Data ---------------------------------------------------------------
  const analyzedCount = useMemo(
    () => (detail ? detail.images.filter(hasAIResult).length : 0),
    [detail],
  );
  const uncheckedCount = detail ? detail.images.length - analyzedCount : 0;
  const totalImages = detail?.images.length ?? 0;
  const allImagesAnalyzed = useMemo(
    () =>
      detail
        ? detail.images.every((img) => hasAIResult(img) || isAnalyzed(img.status))
        : false,
    [detail],
  );

  const filteredImages = useMemo(() => {
    if (!detail) return [];
    const lowered = debouncedSearch.trim().toLowerCase();

    return detail.images.filter((img) => {
      const matchSearch =
        !lowered || img.file_name.toLowerCase().includes(lowered);
      const matchBlade = bladeFilter === "all" || img.blade === bladeFilter;

      let matchClass = true;
      if (listGradeFilter !== "all") {
        const targetType = `LV_${listGradeFilter}`.toUpperCase();
        const hasGrade =
          img.assessments?.some((assessment) =>
            (assessment.ai_bounding_boxes ?? []).some(
              (box) => (box.type || "").toUpperCase() === targetType,
            ),
          ) ?? false;
        matchClass = hasGrade;
      }

      return matchSearch && matchBlade && matchClass;
    });
  }, [detail, debouncedSearch, bladeFilter, listGradeFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredImages.length / PAGE_SIZE)),
    [filteredImages.length],
  );
  const pageImages = useMemo(
    () => filteredImages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredImages, page],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, bladeFilter, listGradeFilter]);

  const analysisStatusMessage = useMemo(() => {
    if (isAnalyzingAll) {
      return `Processing... ${overallProgress}%`;
    }
    if (!detail) return null;
    if (!allImagesAnalyzed) {
      return `Analyzed ${analyzedCount}/${detail.images.length}`;
    }
    return null;
  }, [isAnalyzingAll, overallProgress, detail, allImagesAnalyzed, analyzedCount]);

  const progressPercent = useMemo(
    () => Math.round(Math.min(100, Math.max(0, overallProgress))),
    [overallProgress],
  );

  const canDisplayCanvas = useMemo(
    () =>
      showBBox &&
      bboxData &&
      bboxData.length > 0 &&
      imgMetrics.renderedWidth > 0,
    [showBBox, bboxData, imgMetrics.renderedWidth],
  );

  const canvasPointer = hoveredBox
    ? "pointer"
    : canDisplayCanvas
      ? "crosshair"
      : "default";

  // ----- Helper Callbacks -----------------------------------------------------------
  const memoizedBuildUrl = useCallback((path: string) => {
    if (/^https?:\/\//.test(path)) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return withApiBase(normalized);
  }, []);

  const refreshCacheBust = useCallback(() => {
    cacheBustRef.current = CACHE_BUST();
  }, []);

  const memoizedGetImageStreamUrl = useCallback(
    (id: string, bump?: number) =>
      inspectionService.getImageStreamUrl(id, {
        cacheKey: cacheBustRef.current,
        bump,
      }),
    [],
  );

  const downloadBoundingBoxes = useCallback(() => {
    if (!detail) return;
    const payload = detail.images.map((img) => ({
      id: img.id,
      file_name: img.file_name,
      blade: img.blade,
      surface: img.surface,
      assessments: img.assessments ?? [],
    }));
    downloadJson(
      `inspection-${inspectionId ?? "export"}.json`,
      payload,
    );
  }, [detail, inspectionId]);

  // ----- API Helpers ----------------------------------------------------------------

  const fetchInspectionDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const result = await inspectionService.detail(id);
      if (result.ok) {
        setDetail(result.data as InspectionDetail);
      } else {
        console.error("Failed to load inspection:", result.message);
      }
    } catch (err) {
      console.error("Failed to load inspection:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const fetchResultsOnce = useCallback(
    async (id: string) => {
      try {
        const result = await inspectionService.results(id);
        if (!result.ok) return;

        const images = Array.isArray(result.data?.images) ? result.data.images : [];
        const signature = formatResultsSignature(images);
        if (signature && signature === resultsSignatureRef.current) {
          return;
        }
        resultsSignatureRef.current = signature;

        const resultMap = new Map<string, ResultsItem>();
        for (const entry of images as ResultsItem[]) {
          resultMap.set(entry.image_id, entry);
        }

        setDetail((prev) => {
          if (!prev) return prev;
          let didChange = false;
          const updatedImages = prev.images.map((img) => {
            const result = resultMap.get(img.id);
            if (!result) return img;
            const hasBoxes = result.assessments?.some(
              (assessment) =>
                (assessment.ai_bounding_boxes?.length || 0) > 0,
            );
            if (!hasBoxes) {
              if (result.assessments && result.assessments.length > 0) {
                didChange = true;
                return {
                  ...img,
                  assessments: result.assessments,
                };
              }
              return img;
            }
            didChange = true;
            return {
              ...img,
              assessments: result.assessments,
              status: "analyzed",
            };
          });

          if (!didChange) return prev;

          return {
            ...prev,
            images: updatedImages,
          };
        });
      } catch (err) {
        console.error("Failed to fetch results:", err);
      }
    },
    [],
  );

  // ----- Upload & Analysis ----------------------------------------------------------

  const analyzeOneImage = useCallback(
    async (imageId: string) => {
      setPerImageAnalyzing((prev) => ({ ...prev, [imageId]: true }));
      try {
        const result = await inspectionService.analyzeImage(imageId);
        if (result.ok) {
          setDetail((prev) => {
            if (!prev) return prev;
            const updatedImages = prev.images.map((img) => {
              if (img.id !== imageId) return img;
              const newAssessments: Assessment[] = (
                result.data?.damage_assessments || []
              ).map((assessment: any) => ({
                ai_confidence: assessment.ai_confidence ?? 0,
                ai_bounding_boxes: assessment.ai_bounding_boxes ?? [],
              }));
              return {
                ...img,
                assessments: newAssessments,
                status: "analyzed",
              };
            });
            return {
              ...prev,
              images: updatedImages,
            };
          });

          refreshCacheBust();
          setImageVersionBump((prev) => ({
            ...prev,
            [imageId]: (prev[imageId] || 0) + 1,
          }));
        } else {
          console.error("Analyze failed:", result.message);
        }
      } catch (err) {
        console.error("Analyze failed:", err);
      } finally {
        setPerImageAnalyzing((prev) => ({ ...prev, [imageId]: false }));
      }
    },
    [refreshCacheBust],
  );

  const analyzeAllImages = useCallback(async () => {
    if (!detail) return;
    setIsAnalyzingAll(true);
    setOverallProgress(0);
    try {
      const imgs = detail.images;
      const total = imgs.length;
      let done = 0;

      if (total === 0) {
        setOverallProgress(100);
        return;
      }

      for (let i = 0; i < imgs.length; i += ANALYZE_CONCURRENCY) {
        const chunk = imgs.slice(i, i + ANALYZE_CONCURRENCY);
        await Promise.all(chunk.map((img) => analyzeOneImage(img.id)));
        done += chunk.length;
        const progress = Math.min(100, Math.round((done / total) * 100));
        setOverallProgress(progress);
      }
    } finally {
      if (inspectionId) {
        await fetchResultsOnce(inspectionId);
      }
      if (analyzeAllTimeoutRef.current !== null) {
        window.clearTimeout(analyzeAllTimeoutRef.current);
      }
      analyzeAllTimeoutRef.current = window.setTimeout(() => {
        setIsAnalyzingAll(false);
        analyzeAllTimeoutRef.current = null;
      }, 2000);
    }
  }, [detail, analyzeOneImage, inspectionId, fetchResultsOnce]);

  // ----- Modal Logic ----------------------------------------------------------------

  const refreshImageMetrics = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    if (!naturalWidth || !naturalHeight || !clientWidth || !clientHeight) {
      return;
    }
    const scale = Math.min(
      clientWidth / naturalWidth,
      clientHeight / naturalHeight,
    );
    const renderedWidth = naturalWidth * scale;
    const renderedHeight = naturalHeight * scale;
    const offsetX = (clientWidth - renderedWidth) / 2;
    const offsetY = (clientHeight - renderedHeight) / 2;
    setImgMetrics({ renderedWidth, renderedHeight, offsetX, offsetY });
  }, []);

  const fetchImageBlob = useCallback(
    async (url: string) => {
      setImageLoading(true);
      try {
        const res = await fetch(memoizedBuildUrl(url), {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Unable to load image");
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      } catch (err) {
        setImageLoading(false);
        throw err;
      }
    },
    [memoizedBuildUrl],
  );

  const openModal = useCallback(
    async (imageId: string) => {
      if (!detail) return;
      const idx = filteredImages.findIndex((img) => img.id === imageId);
      if (idx === -1) return;
      const img = filteredImages[idx];
      scrollYBeforeModal.current = window.scrollY;

      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
      setImageBlobUrl(null);
      setModalIndex(idx);
      setModalOpen(true);
      setBboxData(null);
      setAssessmentInfo(null);
      setSelectedBox(null);
      setHoveredBox(null);
      setShowBBox(true);
      setGradeFilter("all");
      setLoadingBbox(true);
      setZoom(1);
      setImgMetrics({ renderedWidth: 0, renderedHeight: 0, offsetX: 0, offsetY: 0 });

      try {
        const bump = imageVersionBump[img.id] || 0;
        const blobUrl = await fetchImageBlob(
          memoizedGetImageStreamUrl(img.id, bump),
        );
        setImageBlobUrl(blobUrl);
      } catch (err) {
        console.error(err);
      }

      if (isAnalyzed(img.status) && Array.isArray(img.assessments)) {
        const allBoxes = img.assessments.flatMap(
          (assessment) => assessment.ai_bounding_boxes ?? [],
        );
        const mergedTypes = Array.from(
          new Set(
            img.assessments.flatMap(
              (assessment) => assessment.ai_damage_types ?? [],
            ),
          ),
        );
        const avgConfidence = img.assessments.length
          ? img.assessments.reduce(
              (acc, assessment) => acc + (assessment.ai_confidence ?? 0),
              0,
            ) / img.assessments.length
          : 0;

        setBboxData(allBoxes);
        if (img.assessments.length > 0) {
          const primary = img.assessments[0];
          setAssessmentInfo({
            ...primary,
            ai_bounding_boxes: allBoxes,
            ai_damage_types: mergedTypes,
            ai_confidence: avgConfidence,
          });
        } else {
          setAssessmentInfo(null);
        }
      }
      setLoadingBbox(false);
    },
    [
      detail,
      filteredImages,
      imageBlobUrl,
      imageVersionBump,
      fetchImageBlob,
      memoizedGetImageStreamUrl,
    ],
  );

  const closeModal = useCallback(() => {
    if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
    setModalOpen(false);
    setModalIndex(null);
    setImageBlobUrl(null);
    setBboxData(null);
    setAssessmentInfo(null);
    setSelectedBox(null);
    setHoveredBox(null);
    setGradeFilter("all");
    setZoom(1);
    setImgMetrics({ renderedWidth: 0, renderedHeight: 0, offsetX: 0, offsetY: 0 });
    setImageLoading(false);
    window.scrollTo({
      top: scrollYBeforeModal.current,
      behavior: "instant" as ScrollBehavior,
    });
  }, [imageBlobUrl]);

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = latestBoxesRef.current
        .slice()
        .reverse()
        .find(
          ({ left, top, width, height }) =>
            x >= left && x <= left + width && y >= top && y <= top + height,
        );
      const nextBox = hit?.box ?? null;
      setHoveredBox((prev) => (prev === nextBox ? prev : nextBox));
    },
    [],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredBox((prev) => (prev ? null : prev));
  }, []);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = latestBoxesRef.current
        .slice()
        .reverse()
        .find(
          ({ left, top, width, height }) =>
            x >= left && x <= left + width && y >= top && y <= top + height,
        );
      if (hit) setSelectedBox(hit.box);
    },
    [],
  );

  const handleWheelZoom = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = -event.deltaY;
    setZoom((prev) => {
      const next = delta > 0 ? prev + ZOOM_STEP : prev - ZOOM_STEP;
      return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(next.toFixed(2))));
    });
  }, []);

  // ----- Canvas Data ----------------------------------------------------------------

  const drawnBoxes = useMemo<DrawnBox[]>(() => {
    if (!showBBox || !bboxData || bboxData.length === 0) return [];
    const { renderedWidth, renderedHeight, offsetX, offsetY } = imgMetrics;
    if (renderedWidth <= 0 || renderedHeight <= 0) return [];

    return bboxData
      .filter((box) => {
        if (gradeFilter === "all") return true;
        const targetType = `LV_${gradeFilter}`.toUpperCase();
        return (box.type || "").toUpperCase() === targetType;
      })
      .map((box) => {
        const widthRatio = Math.min(Math.max(box.width ?? 0, 0), 1);
        const heightRatio = Math.min(Math.max(box.height ?? 0, 0), 1);
        const width = widthRatio * renderedWidth;
        const height = heightRatio * renderedHeight;

        const baseX = (box.x ?? 0) - widthRatio / 2;
        const baseY = (box.y ?? 0) - heightRatio / 2;
        const clampedXRatio = Math.min(Math.max(baseX, 0), 1 - widthRatio);
        const clampedYRatio = Math.min(Math.max(baseY, 0), 1 - heightRatio);

        const left = clampedXRatio * renderedWidth + offsetX;
        const top = clampedYRatio * renderedHeight + offsetY;
        const color = getColorByType(box.type);
        const hasConfidence =
          typeof box.confidence === "number" && !Number.isNaN(box.confidence);
        const label = `${box.type || "N/A"}${
          hasConfidence ? ` ${(box.confidence! * 100).toFixed(1)}%` : ""
        }`.trim();

        return { box, left, top, width, height, color, label };
      });
  }, [showBBox, bboxData, gradeFilter, imgMetrics]);

  const canvasClassName = useMemo(() => {
    const classes = ["bbox-canvas"];
    if (drawnBoxes.length > 0) classes.push("bbox-canvas--interactive");
    if (canvasPointer === "pointer") {
      classes.push("bbox-canvas--cursor-pointer");
    } else if (canvasPointer === "crosshair") {
      classes.push("bbox-canvas--cursor-crosshair");
    } else {
      classes.push("bbox-canvas--cursor-default");
    }
    return classes.join(" ");
  }, [drawnBoxes.length, canvasPointer]);

  // ----- Effects --------------------------------------------------------------------

  useEffect(() => {
    if (!inspectionId) {
      setDetail(null);
      return;
    }
    setDetail(null);
    fetchInspectionDetail(inspectionId);
    fetchResultsOnce(inspectionId);
  }, [inspectionId, fetchInspectionDetail, fetchResultsOnce]);

  useEffect(() => {
    if (!detail || totalImages === 0 || !inspectionId) return;
    if (allImagesAnalyzed) return;
    const intervalId = window.setInterval(() => {
      fetchResultsOnce(inspectionId);
    }, RESULTS_POLL_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [detail, totalImages, inspectionId, allImagesAnalyzed, fetchResultsOnce]);

  useEffect(() => {
    if (!imageBlobUrl) return;
    refreshImageMetrics();
    const handleResize = () => refreshImageMetrics();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageBlobUrl, refreshImageMetrics]);

  useEffect(() => {
    latestBoxesRef.current = drawnBoxes;
  }, [drawnBoxes]);

  useEffect(() => {
    if (!showBBox) setHoveredBox(null);
  }, [showBBox]);

  useEffect(() => {
    if (hoveredBox && !drawnBoxes.some(({ box }) => box === hoveredBox)) {
      setHoveredBox(null);
    }
  }, [hoveredBox, drawnBoxes]);

  useEffect(() => {
    if (selectedBox && !drawnBoxes.some(({ box }) => box === selectedBox)) {
      setSelectedBox(null);
    }
  }, [selectedBox, drawnBoxes]);

  useEffect(() => {
    if (imageBlobUrl) {
      return () => {
        URL.revokeObjectURL(imageBlobUrl);
      };
    }
    return undefined;
  }, [imageBlobUrl]);

  useEffect(() => {
    if (!detail || totalImages === 0) return;
    if (allImagesAnalyzed) {
      setAnalysisBannerVisible(true);
      if (analysisBannerTimeoutRef.current !== null) {
        window.clearTimeout(analysisBannerTimeoutRef.current);
      }
      analysisBannerTimeoutRef.current = window.setTimeout(() => {
        setAnalysisBannerVisible(false);
        analysisBannerTimeoutRef.current = null;
      }, 4000);
    }
  }, [detail, totalImages, allImagesAnalyzed]);

  useEffect(() => {
    return () => {
      if (analyzeAllTimeoutRef.current !== null) {
        window.clearTimeout(analyzeAllTimeoutRef.current);
      }
      if (analysisBannerTimeoutRef.current !== null) {
        window.clearTimeout(analysisBannerTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showBBox || !bboxData || bboxData.length === 0) {
      latestBoxesRef.current = [];
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { renderedWidth, renderedHeight, offsetX, offsetY } = imgMetrics;
    const logicalWidth = Math.max(
      1,
      Math.round(renderedWidth + offsetX * 2),
    );
    const logicalHeight = Math.max(
      1,
      Math.round(renderedHeight + offsetY * 2),
    );
    if (!logicalWidth || !logicalHeight) return;

    canvas.width = logicalWidth;
    canvas.height = logicalHeight;

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.font = "bold 11px sans-serif";
    ctx.textBaseline = "top";

    for (const item of drawnBoxes) {
      const { box, left, top, width, height, color, label } = item;
      const isActive = selectedBox === box;
      const isHovered = hoveredBox === box;
      const baseColor = color;

      ctx.save();
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = isActive ? 0.2 : 0.12;
      ctx.fillRect(left, top, width, height);
      ctx.restore();

      ctx.save();
      ctx.lineWidth = isActive ? 4 : isHovered ? 3 : 2.5;
      ctx.strokeStyle = baseColor;
      if (isActive || isHovered) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = isActive ? 12 : 6;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      ctx.strokeRect(left, top, width, height);
      ctx.restore();

      if (label) {
        const paddingX = 4;
        const paddingY = 2;
        const textMetrics = ctx.measureText(label);
        const labelWidth = textMetrics.width + paddingX * 2;
        const labelHeight = 10 + paddingY * 2;
        const labelX = Math.max(0, left);
        const labelY = Math.max(0, top - labelHeight - 2);

        ctx.save();
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 1;
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.fillText(label, labelX + paddingX, labelY + paddingY);
        ctx.restore();
      }
    }
  }, [
    showBBox,
    bboxData,
    imgMetrics,
    drawnBoxes,
    selectedBox,
    hoveredBox,
  ]);

  // ----- Rendering ------------------------------------------------------------------

  const zoomClassName = useMemo(() => {
    const scaled = Math.round(
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) * 10,
    );
    return `image-layer image-layer--zoom-${scaled}`;
  }, [zoom]);

  const zoomCanvasProps = {
    onWheel: handleWheelZoom,
  };

  const renderStatusBanner = () => {
    if (!analysisStatusMessage) return null;
    return (
      <div className="inspection-alert inspection-alert--info">
        {analysisStatusMessage}
      </div>
    );
  };

  return (
    <div className="ImageListPage">
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      <main className="main-content">
        <div className="content-body">
          <div className="header-row">
            <h3>Inspection - Turbine: {turbineId}</h3>
            <div className="search-wrap">
              <input
                className="search-input"
                placeholder="Search filenames..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
          {analysisBannerVisible && (
            <div className="inspection-alert inspection-alert--success">
              Done. Analysis complete
            </div>
          )}

          {renderStatusBanner()}

          {detail && (
            <div className="inspection-stats">
              <div>
                Total images: <b>{detail.inspection.total_images}</b>
              </div>
              <div>
                Analyzed: <b>{analyzedCount}</b>
              </div>
              <div>
                Unchecked: <b>{uncheckedCount}</b>
              </div>
            </div>
          )}

          {isAnalyzingAll && (
            <div className="inspection-progress">
              <div
                className={`inspection-progress__bar inspection-progress__bar--pct-${progressPercent}`}
              />
            </div>
          )}

          <div className="toolbar toolbar--actions">
            <Button
              variant="submit"
              onClick={analyzeAllImages}
              loading={isAnalyzingAll}
              disabled={!detail || isAnalyzingAll}
            >
              {isAnalyzingAll
                ? `Processing... ${overallProgress}%`
                : "Analyze All"}
            </Button>

            <Button
              variant="detail"
              onClick={downloadBoundingBoxes}
              disabled={!detail}
            >
              Export JSON
            </Button>
          </div>

          <div className="filter-bar">
            <div className="filter-bar__group">
              <label className="filter-bar__label">Blade:</label>
              <select
                value={bladeFilter}
                onChange={(event) => setBladeFilter(event.target.value)}
              >
                <option value="all">All</option>
                <option value="BladeA">Blade A</option>
                <option value="BladeB">Blade B</option>
                <option value="BladeC">Blade C</option>
              </select>
            </div>
            <div className="filter-bar__group">
              <label className="filter-bar__label">Class:</label>
              <select
                value={listGradeFilter}
                onChange={(event) => setListGradeFilter(event.target.value)}
              >
                <option value="all">All</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
              </select>
            </div>
          </div>

          {!detail ? (
            <div className="empty-frame">
              {loadingDetail ? "Loading data..." : "No images found."}
            </div>
          ) : (
            <>
              {loadingDetail && (
                <div className="grid-skeleton">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div className="skeleton-card" key={index} />
                  ))}
                </div>
              )}

              <div className="image-grid">
                {pageImages.map((img) => {
                  const bump = imageVersionBump[img.id] || 0;
                  const analyzing = !!perImageAnalyzing[img.id];
                  const severe = hasSevereDamage(img);
                  const cardClasses = [
                    "image-card",
                    analyzing ? "image-card--analyzing" : "",
                    severe ? "image-card--critical" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={img.id}
                      className={cardClasses}
                      title={`${img.file_name} | ${img.blade}/${img.surface}`}
                    >
                      <div
                        className="image-thumb"
                        onClick={() => openModal(img.id)}
                      >
                        <img
                          src={memoizedGetImageStreamUrl(img.id, bump)}
                          alt={img.file_name}
                          loading="lazy"
                          draggable={false}
                          onError={(event) => {
                            (event.currentTarget as HTMLImageElement).src =
                              memoizedGetImageStreamUrl(img.id, bump + 1);
                          }}
                        />
                        <div className="hover-overlay">View details</div>
                        {analyzing && (
                          <div className="thumb-loading">Analyzing…</div>
                        )}
                      </div>

                      <div className="image-info">
                        <span className="filename" title={img.file_name}>
                          {img.file_name}
                        </span>
                        <span
                          className={`status ${
                            isAnalyzed(img.status) ? "ok" : "raw"
                          }`}
                        >
                          {isAnalyzed(img.status) ? "Analyzed" : "Raw"}
                        </span>
                      </div>

                      <div className="card-actions">
                        {!isAnalyzed(img.status) ? (
                          <Button
                            variant="submit"
                            className="btn-compact"
                            disabled={analyzing || isAnalyzingAll}
                            onClick={() => analyzeOneImage(img.id)}
                          >
                            {analyzing ? "Analyzing..." : "Analyze"}
                          </Button>
                        ) : (
                          <Button
                            variant="detail"
                            className="btn-compact"
                            onClick={() => openModal(img.id)}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pagination">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Prev
                </Button>
                <span>
                  Page {page} / {totalPages}
                </span>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      {modalOpen && modalIndex !== null && filteredImages[modalIndex] && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-image-wrap">
              <div className="viewer-toolbar">
                <Button onClick={() => setShowBBox((value) => !value)}>
                  {showBBox ? "Hide boxes" : "Show boxes"}
                </Button>
                <select
                  className="bbox-filter"
                  value={gradeFilter}
                  onChange={(event) => setGradeFilter(event.target.value)}
                >
                  <option value="all">All Grades</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                </select>
              </div>

              <div className="zoom-canvas" {...zoomCanvasProps}>
                <div className={zoomClassName}>
                  {imageBlobUrl && (
                    <img
                      ref={imgRef}
                      src={imageBlobUrl}
                      alt="preview"
                      className="image-layer__img"
                      onLoad={() => {
                        refreshImageMetrics();
                        setImageLoading(false);
                      }}
                      onError={() => setImageLoading(false)}
                    />
                  )}

                  {(loadingBbox || imageLoading) && (
                    <div className="loading-overlay">
                      Loading image...
                    </div>
                  )}

                  {canDisplayCanvas && (
                    <canvas
                      ref={canvasRef}
                      className={canvasClassName}
                      width={Math.round(
                        imgMetrics.renderedWidth + imgMetrics.offsetX * 2,
                      )}
                      height={Math.round(
                        imgMetrics.renderedHeight + imgMetrics.offsetY * 2,
                      )}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseLeave={handleCanvasMouseLeave}
                      onClick={handleCanvasClick}
                    />
                  )}
                </div>

                {!loadingBbox &&
                  (!bboxData || bboxData.length === 0 || !showBBox) && (
                    <div className="not-analyzed-label">
                      No detections yet
                    </div>
                  )}
              </div>

              <div className="filmstrip">
                {filteredImages
                  .slice(
                    Math.max(0, (modalIndex ?? 0) - 6),
                    (modalIndex ?? 0) + 7,
                  )
                  .map((thumb, idx) => {
                    const startIndex = Math.max(0, (modalIndex ?? 0) - 6);
                    const realIndex = startIndex + idx;
                    const bump = imageVersionBump[thumb.id] || 0;
                    const thumbClasses = [
                      "film-thumb",
                      realIndex === modalIndex ? "film-thumb--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <img
                        key={thumb.id}
                        className={thumbClasses}
                        src={memoizedGetImageStreamUrl(thumb.id, bump)}
                        title={thumb.file_name}
                        onClick={() => openModal(thumb.id)}
                      />
                    );
                  })}
              </div>
            </div>

            <div className="modal-sidebar">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Image info</div>
                  <button className="panel-close" onClick={closeModal}>
                    X
                  </button>
                </div>
                <div className="panel-body">
                  {(() => {
                    const img = filteredImages[modalIndex];
                    if (!img) return null;
                    return (
                      <>
                        <div className="kv">
                          <span>File</span>
                          <b title={img.file_name}>{img.file_name}</b>
                        </div>
                        <div className="kv">
                          <span>Blade</span>
                          <b>{img.blade}</b>
                        </div>
                        <div className="kv">
                          <span>Surface</span>
                          <b>{img.surface}</b>
                        </div>
                        <div className="kv">
                          <span>Status</span>
                          <b>{isAnalyzed(img.status) ? "Analyzed" : "Raw"}</b>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {assessmentInfo && (
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">AI results</div>
                  </div>
                  <div className="panel-body">
                    <p>
                      Primary class:{" "}
                      <b>
                        {assessmentInfo.ai_bounding_boxes?.[0]?.type || "N/A"}
                      </b>
                      {assessmentInfo.grade_label
                        ? ` - ${assessmentInfo.grade_label}`
                        : ""}
                    </p>
                    {assessmentInfo.grade_color && (
                      <p>
                        Alert color:{" "}
                        <b
                          className={`grade-emphasis grade-emphasis--${resolveGradeTone(
                            assessmentInfo.grade_color,
                            assessmentInfo.ai_bounding_boxes?.[0]?.type,
                          )}`}
                        >
                          {assessmentInfo.grade_color}
                        </b>
                      </p>
                    )}
                    <p>
                      Average confidence:{" "}
                      {(assessmentInfo.ai_confidence * 100).toFixed(1)}%
                    </p>
                    {assessmentInfo.ai_damage_types?.length ? (
                      <p>
                        Damage types:{" "}
                        {assessmentInfo.ai_damage_types.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {bboxData && bboxData.length > 0 && (
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">Detected regions</div>
                  </div>
                  <div className="panel-body">
                    {bboxData.map((box, idx) => (
                      <div
                        key={idx}
                        className={`bbox-row ${
                          selectedBox === box ? "bbox-row--active" : ""
                        }`}
                        onClick={() => setSelectedBox(box)}
                      >
                        <div>
                          Class: <b>{box.type || "N/A"}</b>
                        </div>
                        {box.confidence != null && (
                          <div>
                            Confidence: {(box.confidence * 100).toFixed(1)}%
                          </div>
                        )}
                        <div>
                          Position ({box.x.toFixed(2)}, {box.y.toFixed(2)})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDetailPage;

// TODO:
// - Persist zoom and filter preferences per user session.
// - Add keyboard navigation within the modal (arrow keys for previous/next).
// - Surface API errors to the user via a toast system.
// - Add aggregated statistics (e.g., per blade severity counts) to the header.  đây r mà
