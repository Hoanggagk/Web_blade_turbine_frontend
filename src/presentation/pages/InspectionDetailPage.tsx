import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Sidebar from "../components/sidebar";
import Button from "../components/button";
import "../styles/ImageListPage.css";
import { withApiBase } from "../../shared/config/env";
import type {
  Assessment,
  BBox,
  ImageItem,
  InspectionDetail,
  ManualAssessmentPayload,
} from "../../domain/inspections/models";

const PAGE_SIZE = 24;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;

// ====== Helper Types & Utilities ====================================================

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

/**
 * Determines whether an image already has analysis.
 */
const hasAIResult = (img: ImageItem) =>
  img.assessments?.some((a) => (a.ai_bounding_boxes?.length || 0) > 0) ?? false;

/**
 * Determines whether the supplied status marks an image as analysed.
 */
const CHECKED_STATUSES = new Set([
  "checked",
  "completed",
  "done",
  "analysis complete",
  "analyzed",
  "processed",
  "ready",
]);

const UNCHECKED_STATUSES = new Set([
  "unchecked",
  "uncheck",
  "pending",
  "processing",
  "uploaded",
  "new",
  "created",
]);

const toChecklistStatus = (status?: string, hasResult = false): "checked" | "unchecked" => {
  const s = (status || "").trim().toLowerCase();
  if (CHECKED_STATUSES.has(s)) return "checked";
  if (UNCHECKED_STATUSES.has(s)) return "unchecked";
  return hasResult ? "checked" : "unchecked";
};

const isAnalyzed = (status?: string) => toChecklistStatus(status) === "checked";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

type Props = {
  turbineId?: string;
  turbineName?: string;
  inspectionId?: string;
  detail: InspectionDetail | null;
  loadingDetail: boolean;
  isAnalyzingAll: boolean;
  overallProgress: number;
  perImageAnalyzing: Record<string, boolean>;
  imageVersionBump: Record<string, number>;
  analysisBannerVisible: boolean;
  getImageStreamUrl: (imageId: string, bump?: number) => string;
  deletingImageIds?: Record<string, boolean>;
  onAnalyzeAll: () => Promise<void> | void;
  onAnalyzeImage: (imageId: string) => Promise<void> | void;
  onDeleteImages: (imageIds: string[]) => Promise<void> | void;
  onDeleteImage: (imageId: string) => Promise<void> | void;
  onUpdateManualAssessment: (
    imageId: string,
    payload: ManualAssessmentPayload,
  ) => Promise<void> | void;
  onUpdateBoundingBox: (
    imageId: string,
    boxIndex: number,
    updates: Partial<BBox>,
  ) => Promise<void> | void;
  onRefreshDetail?: () => void;
  onRefreshResults?: () => void;
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

const InspectionDetailPage: React.FC<Props> = ({
  turbineId,
  turbineName,
  inspectionId,
  detail,
  loadingDetail,
  isAnalyzingAll,
  overallProgress,
  perImageAnalyzing,
  imageVersionBump,
  analysisBannerVisible,
  getImageStreamUrl,
  deletingImageIds,
  onAnalyzeAll,
  onAnalyzeImage,
  onDeleteImages,
  onDeleteImage,
  onUpdateManualAssessment,
  onUpdateBoundingBox,
  onRefreshDetail,
  onRefreshResults,
}) => {

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounced(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [bladeFilter, setBladeFilter] = useState<string>("all");
  const [listGradeFilter, setListGradeFilter] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [bboxData, setBboxData] = useState<BBox[] | null>(null);
  const [loadingBbox, setLoadingBbox] = useState(false);
  const [selectedBox, setSelectedBox] = useState<BBox | null>(null);
  const [hoveredBox, setHoveredBox] = useState<BBox | null>(null);
  const [showBBox, setShowBBox] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [imageLoading, setImageLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(() => new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [manualDescription, setManualDescription] = useState("");
  const [boxEdit, setBoxEdit] = useState<{ type: string; confidence: string }>({
    type: "",
    confidence: "",
  });
  const [boxEditIndex, setBoxEditIndex] = useState<number | null>(null);
  const [savingManual, setSavingManual] = useState(false);
  const [savingBox, setSavingBox] = useState(false);
  const [manualFeedback, setManualFeedback] = useState<string | null>(null);
  const [boxFeedback, setBoxFeedback] = useState<string | null>(null);

  // ----- Refs -----------------------------------------------------------------------
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgMetrics, setImgMetrics] = useState({
    renderedWidth: 0,
    renderedHeight: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const scrollYBeforeModal = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestBoxesRef = useRef<DrawnBox[]>([]);
  const modalAssessmentsSignatureRef = useRef<string | null>(null);

  // ----- Derived Data ---------------------------------------------------------------
  const checkedSummary = detail?.inspection.checked_summary;
  const analyzedCount = useMemo(
    () =>
      checkedSummary?.checked ??
      detail?.inspection.processed_images ??
      (detail?.images.filter((img) => hasAIResult(img) || isAnalyzed(img.status)).length ??
        0),
    [checkedSummary, detail],
  );
  const uncheckedCount = useMemo(
    () => checkedSummary?.unchecked ?? (detail ? detail.images.length - analyzedCount : 0),
    [checkedSummary, detail, analyzedCount],
  );
  const totalImages = useMemo(
    () => checkedSummary?.total ?? detail?.inspection.total_images ?? detail?.images.length ?? 0,
    [checkedSummary?.total, detail?.images.length, detail?.inspection.total_images],
  );
  const turbineLabel = useMemo(
    () => (turbineName?.trim() ? turbineName.trim() : turbineId || "Unknown"),
    [turbineId, turbineName],
  );
  const allImagesAnalyzed = useMemo(() => {
    if (checkedSummary) {
      return checkedSummary.total > 0 && checkedSummary.checked === checkedSummary.total;
    }
    if (!detail) return false;
    return detail.images.every((img) => hasAIResult(img) || isAnalyzed(img.status));
  }, [checkedSummary, detail]);

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
    if (!detail) {
      setSelectedImageIds(new Set());
      return;
    }
    setSelectedImageIds((prev) => {
      const next = new Set<string>();
      detail.images.forEach((img) => {
        if (prev.has(img.id)) {
          next.add(img.id);
        }
      });
      if (next.size === prev.size && Array.from(next).every((id) => prev.has(id))) {
        return prev;
      }
      return next;
    });
  }, [detail]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, bladeFilter, listGradeFilter]);

  const analysisStatusMessage = useMemo(() => {
    if (isAnalyzingAll) {
      return `Processing... ${overallProgress}%`;
    }
    if (!detail) return null;
    if (!allImagesAnalyzed) {
      const total = totalImages || detail.images.length;
      return `Checked ${analyzedCount}/${total}`;
    }
    return null;
  }, [
    allImagesAnalyzed,
    analyzedCount,
    detail,
    isAnalyzingAll,
    overallProgress,
    totalImages,
  ]);

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

  const formattedBoxConfidence = useMemo(() => {
    if (!boxEdit.confidence) return "N/A";
    const parsed = Number(boxEdit.confidence);
    if (Number.isNaN(parsed)) return boxEdit.confidence;
    return `${(parsed * 100).toFixed(1)}%`;
  }, [boxEdit.confidence]);

  // ----- Helper Callbacks -----------------------------------------------------------
  const memoizedBuildUrl = useCallback((path: string) => {
    if (/^https?:\/\//.test(path)) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return withApiBase(normalized);
  }, []);

  const buildImageStreamUrl = useCallback(
    (id: string, bump?: number) => getImageStreamUrl(id, bump),
    [getImageStreamUrl],
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

  const selectedCount = selectedImageIds.size;
  const visibleCount = filteredImages.length;
  const hasVisibleImages = visibleCount > 0;
  const isDeletingSelection = Array.from(selectedImageIds).some(
    (id) => deletingImageIds?.[id],
  );

  const toggleImageSelection = useCallback((imageId: string) => {
    if (!imageId) return;
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedImageIds(new Set([imageId]));
      return;
    }
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  }, [selectionMode]);

  const clearSelection = useCallback(() => {
    setSelectedImageIds(new Set());
  }, []);

  const handleEnterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setSelectedImageIds(new Set());
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedImageIds(new Set());
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    if (!selectionMode) {
      setSelectionMode(true);
    }
    setSelectedImageIds((prev) => {
      const visibleIds = filteredImages.map((img) => img.id);
      if (visibleIds.length === 0) return new Set();
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        return new Set();
      }
      return new Set(visibleIds);
    });
  }, [filteredImages, selectionMode]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedImageIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedImageIds.size} selected image(s)?`)) return;
    onDeleteImages(Array.from(selectedImageIds));
    clearSelection();
  }, [selectedImageIds, onDeleteImages, clearSelection]);

  // ----- API Helpers ----------------------------------------------------------------

  const handleAnalyzeOneImage = useCallback(
    (imageId: string) => {
      if (!imageId) return;
      onAnalyzeImage(imageId);
    },
    [onAnalyzeImage],
  );

  const handleRefresh = useCallback(() => {
    onRefreshDetail?.();
    onRefreshResults?.();
  }, [onRefreshDetail, onRefreshResults]);

  const handleAnalyzeAllImages = useCallback(() => {
    if (!detail) return;
    onAnalyzeAll();
  }, [detail, onAnalyzeAll]);

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
      const firstAssessment = Array.isArray(img.assessments)
        ? img.assessments[0]
        : undefined;
      scrollYBeforeModal.current = window.scrollY;

      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
      setImageBlobUrl(null);
      setModalIndex(idx);
      setModalOpen(true);
      setBboxData(null);
      setSelectedBox(null);
      setHoveredBox(null);
      setShowBBox(true);
      setGradeFilter("all");
      setLoadingBbox(true);
      setZoom(1);
      setImgMetrics({ renderedWidth: 0, renderedHeight: 0, offsetX: 0, offsetY: 0 });
      setBoxEditIndex(null);
      setBoxEdit({ type: "", confidence: "" });
      setManualDescription(firstAssessment?.description ?? "");
      setManualFeedback(null);
      setBoxFeedback(null);
      modalAssessmentsSignatureRef.current = null;

      try {
        const bump = imageVersionBump[img.id] || 0;
        const blobUrl = await fetchImageBlob(
          buildImageStreamUrl(img.id, bump),
        );
        setImageBlobUrl(blobUrl);
      } catch (err) {
        console.error(err);
      }

      if (Array.isArray(img.assessments)) {
        const allBoxes = img.assessments.flatMap(
          (assessment) => assessment.ai_bounding_boxes ?? [],
        );
        setBboxData(allBoxes);
      }
      setLoadingBbox(false);
    },
    [
      detail,
      filteredImages,
      imageBlobUrl,
      imageVersionBump,
      fetchImageBlob,
      buildImageStreamUrl,
    ],
  );

  const closeModal = useCallback(() => {
    if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
    setModalOpen(false);
    setModalIndex(null);
    setImageBlobUrl(null);
    setBboxData(null);
    setSelectedBox(null);
    setHoveredBox(null);
    setGradeFilter("all");
    setZoom(1);
    setImgMetrics({ renderedWidth: 0, renderedHeight: 0, offsetX: 0, offsetY: 0 });
    setImageLoading(false);
    setManualFeedback(null);
    setBoxFeedback(null);
    modalAssessmentsSignatureRef.current = null;
    window.scrollTo({
      top: scrollYBeforeModal.current,
      behavior: "instant" as ScrollBehavior,
    });
  }, [imageBlobUrl]);

  const handleBoxTypeChange = useCallback((value: string) => {
    setBoxEdit((prev) => ({
      ...prev,
      type: value,
    }));
  }, []);

  const handleSaveManualDescription = useCallback(async () => {
    if (!modalOpen || modalIndex === null) return;
    const img = filteredImages[modalIndex];
    if (!img) return;
    setSavingManual(true);
    try {
      await Promise.resolve(
        onUpdateManualAssessment(img.id, {
          description: manualDescription.trim() || undefined,
          ai_bounding_boxes: bboxData ?? undefined,
        }),
      );
      setManualFeedback(`Saved ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("Save manual assessment failed:", error);
      setManualFeedback("Save failed");
    } finally {
      setSavingManual(false);
    }
  }, [
    bboxData,
    filteredImages,
    manualDescription,
    modalIndex,
    modalOpen,
    onUpdateManualAssessment,
  ]);

  const handleSaveBoundingBox = useCallback(async () => {
    if (!modalOpen || modalIndex === null || boxEditIndex === null) return;
    const img = filteredImages[modalIndex];
    if (!img || !bboxData) return;

    const trimmedType = boxEdit.type.trim();
    if (!trimmedType) {
      alert("Class cannot be empty");
      return;
    }

    const normalizedType = trimmedType.toUpperCase();
    const currentBox = bboxData[boxEditIndex];
    const currentType = currentBox?.type ?? "";
    if (normalizedType === currentType) {
      alert("No changes to save");
      return;
    }

    const updates: Partial<BBox> = { type: normalizedType };

    setSavingBox(true);
    let nextSelected: BBox | null = null;
    try {
      await Promise.resolve(onUpdateBoundingBox(img.id, boxEditIndex, updates));
      setBoxFeedback(`Updated ${new Date().toLocaleTimeString()}`);
      setBboxData((prev) => {
        if (!prev) return prev;
        const next = prev.map((box, idx) => {
          if (idx === boxEditIndex) {
            const merged = { ...box, ...updates };
            nextSelected = merged;
            return merged;
          }
          return box;
        });
        return next;
      });
    } catch (error) {
      console.error("Update bounding box failed:", error);
      setBoxFeedback("Update failed");
    } finally {
      setSavingBox(false);
      if (nextSelected) {
        setSelectedBox(nextSelected);
      }
    }
  }, [
    bboxData,
    boxEdit.type,
    boxEditIndex,
    filteredImages,
    modalIndex,
    modalOpen,
    onUpdateBoundingBox,
  ]);

  const handleDeleteSingle = useCallback(
    async (imageId: string) => {
      if (!imageId) return;
      if (!window.confirm("Delete this image?")) return;
      await Promise.resolve(onDeleteImage(imageId));
      setSelectedImageIds((prev) => {
        if (!prev.has(imageId)) return prev;
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
      if (modalOpen && modalIndex !== null) {
        const active = filteredImages[modalIndex];
        if (active?.id === imageId) {
          closeModal();
        }
      }
    },
    [closeModal, filteredImages, modalIndex, modalOpen, onDeleteImage],
  );

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
    if (!bboxData || !selectedBox) {
      setBoxEditIndex(null);
      setBoxEdit({ type: "", confidence: "" });
      return;
    }
    const matchIndex = bboxData.findIndex((entry) => entry === selectedBox);
    if (matchIndex === -1) {
      setBoxEditIndex(null);
      setBoxEdit({ type: "", confidence: "" });
      return;
    }
    setBoxEditIndex(matchIndex);
    const { type, confidence } = selectedBox;
    setBoxEdit({
      type: type ?? "",
      confidence:
        confidence != null && !Number.isNaN(confidence) ? String(confidence) : "",
    });
  }, [bboxData, selectedBox]);

  useEffect(() => {
    setManualFeedback(null);
  }, [manualDescription]);

  useEffect(() => {
    setBoxFeedback(null);
  }, [boxEdit.type, boxEditIndex]);

  useEffect(() => {
    if (selectionMode && visibleCount === 0) {
      setSelectionMode(false);
      setSelectedImageIds(new Set());
    }
  }, [selectionMode, visibleCount]);

  useEffect(() => {
    if (!modalOpen || modalIndex === null) return;
    const image = filteredImages[modalIndex];
    if (!image) return;
    const assessments = image.assessments ?? [];
    const signature = JSON.stringify(
      assessments.map((assessment) => ({
        desc: assessment.description ?? "",
        boxes: (assessment.ai_bounding_boxes ?? []).map((box) => [
          box.x,
          box.y,
          box.width,
          box.height,
          box.type ?? "",
          box.confidence ?? 0,
        ]),
      })),
    );
    if (signature === modalAssessmentsSignatureRef.current) return;
    modalAssessmentsSignatureRef.current = signature;
    const allBoxes = assessments.flatMap(
      (assessment) => assessment.ai_bounding_boxes ?? [],
    );
    setBboxData(allBoxes);
  }, [filteredImages, modalIndex, modalOpen]);

  useEffect(() => {
    if (imageBlobUrl) {
      return () => {
        URL.revokeObjectURL(imageBlobUrl);
      };
    }
    return undefined;
  }, [imageBlobUrl]);

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

  const pageClassName = useMemo(
    () =>
      ["ImageListPage", selectionMode ? "ImageListPage--selecting" : ""]
        .filter(Boolean)
        .join(" "),
    [selectionMode],
  );

  return (
    <div className={pageClassName}>
      <aside className="sidebar-content">
        <Sidebar />
      </aside>

      <main className="main-content">
        <div className="content-body">
          <div className="header-row">
            <h3>Inspection - Turbine: {turbineLabel}</h3>
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
              <span className="inspection-alert__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M8.333 13.167 5.5 10.333l-1 1 3.833 3.834 8-8-1-1-7 7Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <div className="inspection-alert__content">
                <span className="inspection-alert__title">Analysis finished</span>
                <span className="inspection-alert__subtitle">
                  All findings are ready for review.
                </span>
              </div>
            </div>
          )}

          {renderStatusBanner()}

          {detail?.inspection &&
            (() => {
              const inspection = detail.inspection;
              return (
                <div className="inspection-meta">
                  <div className="inspection-meta__item">
                    <span>Inspection</span>
                    <b>{inspection.inspection_code ?? inspection.id}</b>
                  </div>
                  <div className="inspection-meta__item">
                    <span>Status</span>
                    {(() => {
                      const raw = inspection.status || "Unknown";
                      const normalized =
                        raw.toLowerCase().replace(/\s+/g, "-") || "unknown";
                      return (
                        <span className={`status-badge status-${normalized}`}>
                        {raw}
                      </span>
                    );
                  })()}
                </div>
                  <div className="inspection-meta__item">
                    <span>Created</span>
                    <b>{formatDateTime(inspection.created_at)}</b>
                  </div>
                </div>
              );
            })()}

          {detail && (
            <div className="inspection-stats">
              <div className="inspection-stats__list">
                <div>
                  Total images: <b>{totalImages}</b>
                </div>
                <div>
                  Checked: <b>{analyzedCount}</b>
                </div>
                <div>
                  Unchecked: <b>{uncheckedCount}</b>
                </div>
              </div>
              <Button
                variant="detail"
                className="inspection-stats__export btn-compact"
                onClick={downloadBoundingBoxes}
                disabled={!detail}
              >
                Export JSON
              </Button>
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
            <div className="toolbar__group">
              <Button
                variant="submit"
                onClick={handleAnalyzeAllImages}
                loading={isAnalyzingAll}
                disabled={!detail || isAnalyzingAll}
              >
                {isAnalyzingAll
                  ? `Processing... ${overallProgress}%`
                  : "Analyze All"}
              </Button>

              <Button
                variant="detail"
                onClick={handleRefresh}
                disabled={!onRefreshDetail && !onRefreshResults}
              >
                Refresh
              </Button>

              {!selectionMode ? (
                <Button
                  variant="detail"
                  onClick={handleEnterSelectionMode}
                  disabled={!hasVisibleImages}
                >
                  Select
                </Button>
              ) : (
                <>
                  <Button
                    variant="detail"
                    className="btn-compact"
                    onClick={handleSelectAllVisible}
                    disabled={!hasVisibleImages}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="detail"
                    className="btn-compact"
                    onClick={clearSelection}
                    disabled={selectedCount === 0}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="cancel"
                    className="btn-compact"
                    onClick={handleExitSelectionMode}
                  >
                    Done
                  </Button>
                </>
              )}
            </div>

            {selectionMode && (
              <div className="toolbar-selection">
                <span className="toolbar-selection__count">
                  {selectedCount} selected
                </span>
                <Button
                  variant="delete"
                  className="toolbar-selection__delete"
                  onClick={handleDeleteSelected}
                  disabled={selectedCount === 0 || isDeletingSelection}
                  loading={isDeletingSelection}
                >
                  Delete Selected
                </Button>
              </div>
            )}
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
                  const isSelected = selectedImageIds.has(img.id);
                  const cardClasses = [
                    "image-card",
                    analyzing ? "image-card--analyzing" : "",
                    severe ? "image-card--critical" : "",
                    isSelected ? "image-card--selected" : "",
                    selectionMode ? "image-card--selecting" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={img.id}
                      className={cardClasses}
                      title={`${img.file_name} | ${img.blade}/${img.surface}`}
                    >
                      {selectionMode && (
                        <div className="image-card__chrome">
                          <label
                            className={`image-card__select ${
                              isSelected ? "image-card__select--active" : ""
                            }`}
                            data-state={isSelected ? "checked" : "unchecked"}
                          >
                            <input
                              type="checkbox"
                              className="image-card__checkbox"
                              checked={isSelected}
                              onChange={() => toggleImageSelection(img.id)}
                              aria-label={
                                isSelected ? "Remove selection" : "Select image"
                              }
                            />
                            <span className="image-card__select-label">
                              {isSelected ? "Selected" : "Select image"}
                            </span>
                          </label>
                        </div>
                      )}
                      <div
                        className="image-thumb"
                        onClick={() => {
                          if (selectionMode) {
                            toggleImageSelection(img.id);
                          } else {
                            openModal(img.id);
                          }
                        }}
                      >
                        <img
                          src={buildImageStreamUrl(img.id, bump)}
                          alt={img.file_name}
                          loading="lazy"
                          draggable={false}
                          onError={(event) => {
                            (event.currentTarget as HTMLImageElement).src =
                              buildImageStreamUrl(img.id, bump + 1);
                          }}
                        />
                        <div className="hover-overlay">
                          {selectionMode
                            ? isSelected
                              ? "Selected"
                              : "Click to select"
                            : "View details"}
                        </div>
                        {analyzing && (
                          <div className="thumb-loading">Analyzing...</div>
                        )}
                      </div>

                      <div className="image-info">
                        <span className="filename" title={img.file_name}>
                          {img.file_name}
                        </span>
                        <span
                          className={`status ${
                            isAnalyzed(img.status) ? "checked" : "unchecked"
                          }`}
                        >
                          {isAnalyzed(img.status) ? "Checked" : "Unchecked"}
                        </span>
                      </div>

                      {!selectionMode && (
                        <div className="card-actions card-actions--compact">
                          {!isAnalyzed(img.status) ? (
                            <Button
                              variant="submit"
                              className="btn-compact"
                              disabled={analyzing || isAnalyzingAll}
                              onClick={() => handleAnalyzeOneImage(img.id)}
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
                      )}
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
                <div className="viewer-toolbar__group">
                  <Button
                    onClick={() => setShowBBox((value) => !value)}
                    className={`viewer-toolbar__toggle ${
                      showBBox ? "viewer-toolbar__toggle--active" : ""
                    }`}
                    variant="cancel"
                  >
                    {showBBox ? "Hide boxes" : "Show boxes"}
                  </Button>
                </div>
                <div className="viewer-toolbar__group">
                  <select
                    className="bbox-filter"
                    value={gradeFilter}
                    onChange={(event) => setGradeFilter(event.target.value)}
                    aria-label="Bounding box severity filter"
                  >
                    <option value="all">All Grades</option>
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                  </select>
                </div>
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
                        src={buildImageStreamUrl(thumb.id, bump)}
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
                          <b>{isAnalyzed(img.status) ? "Checked" : "Unchecked"}</b>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <Button
                            variant="delete"
                            className="btn-compact"
                            onClick={() => handleDeleteSingle(img.id)}
                            loading={!!deletingImageIds?.[img.id]}
                          >
                            Delete Image
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

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

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Manual overrides</div>
                </div>
                <div className="panel-body">
                  <div className="manual-edit">
                    <label className="manual-edit__field">
                      <span>Description</span>
                      <textarea
                        className="manual-edit__input manual-edit__textarea"
                        rows={3}
                        value={manualDescription}
                        onChange={(event) => setManualDescription(event.target.value)}
                        placeholder="Add notes or overrides..."
                      />
                    </label>
                    <div className="manual-edit__controls">
                      <Button
                        variant="detail"
                        onClick={handleSaveManualDescription}
                        loading={savingManual}
                        disabled={!modalOpen || modalIndex === null}
                      >
                        Save Description
                      </Button>
                      {manualFeedback && (
                        <span
                          className={`manual-edit__status ${
                            manualFeedback.toLowerCase().includes("fail")
                              ? "manual-edit__status--dirty"
                              : "manual-edit__status--clean"
                          }`}
                        >
                          {manualFeedback}
                        </span>
                      )}
                    </div>

                    {boxEditIndex !== null ? (
                      <>
                        <div className="manual-edit__grid manual-edit__grid--single">
                          <label className="manual-edit__field">
                            <span>Class</span>
                            <input
                              className="manual-edit__input"
                              value={boxEdit.type}
                              onChange={(event) =>
                                handleBoxTypeChange(event.target.value)
                              }
                              placeholder="e.g. LV_2"
                            />
                            <span className="manual-edit__hint">
                              e.g. LV_1, LV_2, LV_3, LV_4, LV_5
                            </span>
                          </label>
                          <div className="manual-edit__field manual-edit__field--readonly">
                            <span>Confidence</span>
                            <div className="manual-edit__readonly">
                              {formattedBoxConfidence}
                            </div>
                            <span className="manual-edit__hint">
                              
                            </span>
                          </div>
                        </div>
                        <div className="manual-edit__controls">
                          <Button
                            variant="submit"
                            onClick={handleSaveBoundingBox}
                            loading={savingBox}
                          >
                            Update Box #{boxEditIndex + 1}
                          </Button>
                          {boxFeedback && (
                            <span
                              className={`manual-edit__status ${
                                boxFeedback.toLowerCase().includes("fail")
                                  ? "manual-edit__status--dirty"
                                  : "manual-edit__status--clean"
                              }`}
                            >
                              {boxFeedback}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="manual-edit__empty">
                        Select a bounding box to adjust its class label.
                      </p>
                    )}
                  </div>
                </div>
              </div>
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

