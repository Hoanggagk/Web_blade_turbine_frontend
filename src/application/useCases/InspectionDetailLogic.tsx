import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useParams } from "react-router-dom";
import InspectionDetailPage from "../../presentation/pages/InspectionDetailPage";
import {
  type Assessment,
  type BBox,
  type InspectionDetail,
  type ManualAssessmentPayload,
} from "../../domain/inspections/models";
import { inspectionService } from "../../infrastructure/http/auth/inspectionService";

type RouteParams = {
  turbineId?: string;
  inspectionId?: string;
};

type LocationState = {
  turbine?: {
    id: string;
    name?: string;
  };
};

const CACHE_BUST = () => Date.now().toString();
const RESULTS_POLL_INTERVAL = 7000;
const ANALYZE_CONCURRENCY = 4;

const CHECKED_LABELS = new Set([
  "checked",
  "completed",
  "done",
  "analysis complete",
  "analysis_complete",
  "analyzed",
  "processed",
  "ready",
  "true",
  "1",
]);

const UNCHECKED_LABELS = new Set([
  "unchecked",
  "uncheck",
  "pending",
  "processing",
  "uploaded",
  "new",
  "created",
  "false",
  "0",
]);

const normalizeChecklistStatus = (status?: string): "checked" | "unchecked" => {
  const normalized = (status || "").trim().toLowerCase();
  if (CHECKED_LABELS.has(normalized)) return "checked";
  if (UNCHECKED_LABELS.has(normalized)) return "unchecked";
  return "unchecked";
};

const normalizeCheckedSummary = <
  T extends {
    total: number;
    checked: number;
    unchecked: number;
    status: string;
  } | undefined,
>(
  summary: T,
) =>
  summary
    ? {
        ...summary,
        status: normalizeChecklistStatus(summary.status),
      }
    : summary;

type ResultAssessmentPayload = Partial<Assessment> & {
  bounding_boxes?: BBox[];
  damage_boxes?: BBox[];
  confidence?: number;
  damage_types?: string[];
};

const normalizeAssessmentList = (
  input?: ResultAssessmentPayload[] | null,
): Assessment[] => {
  if (!Array.isArray(input) || input.length === 0) return [];
  return input.map((entry) => {
    const fallbackBoxes =
      (Array.isArray(entry.bounding_boxes) ? entry.bounding_boxes : undefined) ??
      (Array.isArray(entry.damage_boxes) ? entry.damage_boxes : undefined) ??
      [];
    return {
      ai_confidence: entry.ai_confidence ?? entry.confidence ?? 0,
      ai_bounding_boxes: entry.ai_bounding_boxes ?? fallbackBoxes,
      ai_damage_types: entry.ai_damage_types ?? entry.damage_types ?? [],
      damage_grade: entry.damage_grade,
      grade_label: entry.grade_label,
      grade_color: entry.grade_color,
      description: entry.description,
      damage_length_mm: entry.damage_length_mm,
      damage_width_mm: entry.damage_width_mm,
      damage_area_mm2: entry.damage_area_mm2,
      pixel_to_mm_ratio: entry.pixel_to_mm_ratio,
    };
  });
};

const extractResultAssessments = (item?: {
  assessments?: ResultAssessmentPayload[];
  damage_assessments?: ResultAssessmentPayload[];
}): { list: Assessment[]; provided: boolean } => {
  if (!item) return { list: [], provided: false };
  const hasAssessmentsField = item.assessments !== undefined;
  const normalizedAssessments = normalizeAssessmentList(item.assessments);
  if (hasAssessmentsField) {
    return { list: normalizedAssessments, provided: true };
  }
  const hasDamageAssessmentsField = item.damage_assessments !== undefined;
  const normalizedDamageAssessments = normalizeAssessmentList(item.damage_assessments);
  if (hasDamageAssessmentsField) {
    return { list: normalizedDamageAssessments, provided: true };
  }
  return {
    list:
      normalizedAssessments.length > 0 ? normalizedAssessments : normalizedDamageAssessments,
    provided: false,
  };
};

const resolveImageAssessments = (item?: {
  assessments?: ResultAssessmentPayload[];
  damage_assessments?: ResultAssessmentPayload[];
}): Assessment[] => extractResultAssessments(item).list;

const formatResultsSignature = (
  items: Array<{
    image_id: string;
    assessments?: ResultAssessmentPayload[];
    damage_assessments?: ResultAssessmentPayload[];
  }>,
) => {
  if (!items) return null;
  return JSON.stringify(
    items.map((item) => ({
      id: item.image_id,
      assessments: resolveImageAssessments(item).map((assessment) => ({
        confidence: assessment.ai_confidence ?? 0,
        boxes: assessment.ai_bounding_boxes?.length ?? 0,
      })),
    })),
  );
};

const InspectionDetailLogic: React.FC = () => {
  const { turbineId = "", inspectionId = "" } = useParams<RouteParams>();
  const location = useLocation() as { state?: LocationState };

  const [detail, setDetail] = useState<InspectionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [perImageAnalyzing, setPerImageAnalyzing] = useState<Record<string, boolean>>({});
  const [imageVersionBump, setImageVersionBump] = useState<Record<string, number>>({});
  const [analysisBannerVisible, setAnalysisBannerVisible] = useState(false);
  const [cacheKey, setCacheKey] = useState(CACHE_BUST());
  const [deletingImageIds, setDeletingImageIds] = useState<Record<string, boolean>>({});
  const [turbineName, setTurbineName] = useState(location.state?.turbine?.name ?? "");

  useEffect(() => {
    if (location.state?.turbine?.name) {
      setTurbineName(location.state.turbine.name);
    }
  }, [location.state?.turbine?.name]);

  const resultsSignatureRef = useRef<string | null>(null);
  const pollingRef = useRef<number | null>(null);
  const bannerTimeoutRef = useRef<number | null>(null);

  const refreshCacheKey = useCallback(() => {
    setCacheKey(CACHE_BUST());
  }, []);

  const fetchInspectionDetail = useCallback(
    async (id: string) => {
      setLoadingDetail(true);
      try {
        const response = await inspectionService.detail(id);
        if (!response.ok) {
          alert(response.message || "Failed to load inspection");
          return;
        }
        const payload = response.data;
        if (!payload) {
          setDetail(null);
          return;
        }

        const normalizedSummary = normalizeCheckedSummary(
          payload.inspection.checked_summary,
        );
        const normalizedImages = (payload.images ?? []).map((img) => ({
          ...img,
          assessments: img.assessments ?? [],
          status: normalizeChecklistStatus(img.status),
        }));

        const normalizedInspection = {
          ...payload.inspection,
          status: normalizeChecklistStatus(
            payload.inspection.status ?? normalizedSummary?.status,
          ),
          processing_status: payload.inspection.processing_status,
          checked_summary: normalizedSummary,
        };

        const processedImages =
          normalizedInspection.processed_images ??
          normalizedInspection.checked_summary?.checked ??
          0;
        const totalImages =
          normalizedInspection.total_images ??
          normalizedInspection.checked_summary?.total ??
          normalizedImages.length;

        setDetail({
          ...payload,
          inspection: {
            ...normalizedInspection,
            processed_images: processedImages,
            total_images: totalImages,
          },
          images: normalizedImages,
        });
        setImageVersionBump({});
      } catch (error) {
        console.error("Failed to load inspection detail:", error);
        alert("Failed to load inspection detail");
      } finally {
        setLoadingDetail(false);
      }
    },
    [],
  );

  const fetchResults = useCallback(async () => {
    if (!inspectionId) return;
    try {
      const response = await inspectionService.results(inspectionId);
      if (!response.ok || !response.data) return;

      const images = Array.isArray(response.data.images) ? response.data.images : [];
      const signature = formatResultsSignature(images);
      if (signature && signature === resultsSignatureRef.current) {
        return;
      }
      resultsSignatureRef.current = signature;

      const resultMap = new Map<
        string,
        { assessments: Assessment[]; status?: string; providedAssessments: boolean }
      >();
      images.forEach((item) => {
        const { list, provided } = extractResultAssessments(item);
        resultMap.set(item.image_id, {
          assessments: list,
          status: item.status,
          providedAssessments: provided,
        });
      });

      setDetail((prev) => {
        if (!prev) return prev;
        let didChange = false;
        const updatedImages = prev.images.map((img) => {
          const entry = resultMap.get(img.id);
          if (!entry) return img;
          const nextStatus = entry.status
            ? normalizeChecklistStatus(entry.status)
            : img.status;
          const incomingAssessments = entry.assessments ?? [];
          const shouldReplaceAssessments = entry.providedAssessments;
          const currentAssessments = img.assessments ?? [];
          const nextAssessments = shouldReplaceAssessments
            ? incomingAssessments
            : currentAssessments;
          if (
            entry.status === undefined &&
            !shouldReplaceAssessments &&
            nextStatus === img.status
          ) {
            return img;
          }
          didChange = true;
          return {
            ...img,
            assessments: nextAssessments,
            status: nextStatus,
          };
        });

        if (
          !didChange &&
          !response.data?.metadata &&
          !response.data?.statistics
        ) {
          return prev;
        }

        const metadata = response.data?.metadata;
        const statistics = response.data?.statistics;

        let nextSummary = normalizeCheckedSummary(
          metadata?.checked_summary ?? prev.inspection.checked_summary,
        );

        if (!nextSummary && statistics) {
          const statsTotal =
            statistics.total_images ??
            prev.inspection.total_images ??
            updatedImages.length;
          const statsChecked =
            statistics.checked_images ??
            statistics.analyzed_images ??
            prev.inspection.checked_summary?.checked ??
            0;
          const statsUnchecked =
            statistics.unchecked_images ??
            Math.max(0, statsTotal - statsChecked);
          nextSummary = {
            total: statsTotal,
            checked: statsChecked,
            unchecked: statsUnchecked,
            status:
              statsTotal > 0 && statsChecked === statsTotal ? "checked" : "unchecked",
          };
        }

        const nextProcessed =
          metadata?.processed_images ??
          nextSummary?.checked ??
          prev.inspection.processed_images;

        const nextTotal =
          metadata?.total_images ??
          nextSummary?.total ??
          prev.inspection.total_images ??
          updatedImages.length;

        const nextStatus = normalizeChecklistStatus(
          metadata?.status ??
            nextSummary?.status ??
            prev.inspection.status,
        );

        return {
          ...prev,
          inspection: {
            ...prev.inspection,
            processed_images: nextProcessed,
            total_images: nextTotal,
            status: nextStatus,
            processing_status:
              metadata?.processing_status ??
              prev.inspection.processing_status,
            checked_summary: nextSummary,
          },
          images: updatedImages,
        };
      });
    } catch (error) {
      console.error("Failed to fetch inspection results:", error);
    }
  }, [inspectionId]);

  const analyzeImageInternal = useCallback(
    async (
      imageId: string,
      options?: {
        refreshResults?: boolean;
      },
    ) => {
      if (!imageId) return;
      const { refreshResults: shouldRefreshResults = true } = options ?? {};
      setPerImageAnalyzing((prev) => ({ ...prev, [imageId]: true }));
      try {
        const response = await inspectionService.analyzeImage(imageId);
        if (!response.ok) {
          alert(response.message || "Analyze failed");
          return;
        }
        const assessments: Assessment[] = (response.data?.damage_assessments ?? []).map(
          (entry) => ({
            ai_confidence: entry.ai_confidence ?? 0,
            ai_bounding_boxes: entry.ai_bounding_boxes ?? [],
            ai_damage_types: entry.ai_damage_types ?? [],
            damage_grade: entry.damage_grade,
          }),
        );

        setDetail((prev) => {
          if (!prev) return prev;
          const updatedImages = prev.images.map((img) => {
            if (img.id !== imageId) return img;
            return {
              ...img,
              assessments,
              status: "checked",
            };
          });
          return {
            ...prev,
            images: updatedImages,
          };
        });

        refreshCacheKey();
        setImageVersionBump((prev) => ({
          ...prev,
          [imageId]: (prev[imageId] || 0) + 1,
        }));
        if (shouldRefreshResults) {
          await fetchResults();
        }
      } catch (error) {
        console.error("Analyze image failed:", error);
        alert("Analyze image failed");
      } finally {
        setPerImageAnalyzing((prev) => ({ ...prev, [imageId]: false }));
      }
    },
    [fetchResults, refreshCacheKey],
  );

  const handleAnalyzeImage = useCallback(
    async (imageId: string) => analyzeImageInternal(imageId),
    [analyzeImageInternal],
  );

  const handleAnalyzeAllImages = useCallback(async () => {
    if (!detail || !detail.images.length) return;
    setIsAnalyzingAll(true);
    setOverallProgress(0);
    try {
      const targets = detail.images.slice();
      const total = targets.length;
      let completed = 0;

      for (let index = 0; index < targets.length; index += ANALYZE_CONCURRENCY) {
        const chunk = targets.slice(index, index + ANALYZE_CONCURRENCY);
        await Promise.all(
          chunk.map((img) =>
            analyzeImageInternal(img.id, { refreshResults: false }),
          ),
        );
        completed += chunk.length;
        const pct = Math.min(100, Math.round((completed / total) * 100));
        setOverallProgress(pct);
      }

      setOverallProgress(100);
      await fetchResults();
    } finally {
      setIsAnalyzingAll(false);
    }
  }, [analyzeImageInternal, detail, fetchResults]);

  const handleDownloadInspectionReport = useCallback(async () => {
    if (!inspectionId) {
      throw new Error("Missing inspection ID");
    }
    const response = await inspectionService.exportInspectionPdf(inspectionId);
    if (!response.ok || !response.data) {
      throw new Error(response.message || "Failed to download inspection report");
    }
    return response.data;
  }, [inspectionId]);

  const handleDeleteImages = useCallback(
    async (imageIds: string[]) => {
      if (!inspectionId || imageIds.length === 0) return;
      const ids = Array.from(new Set(imageIds));
      setDeletingImageIds((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          next[id] = true;
        });
        return next;
      });

      try {
        const response = await inspectionService.deleteImages(inspectionId, ids);
        if (!response.ok) {
          alert(response.message || "Delete images failed");
          return;
        }

        setDetail((prev) => {
          if (!prev) return prev;
          const idSet = new Set(ids);
          const remaining = prev.images.filter((img) => !idSet.has(img.id));
          const removed = prev.images.length - remaining.length;
          if (!removed) return prev;

          return {
            ...prev,
            inspection: {
              ...prev.inspection,
              total_images: Math.max(
                0,
                (prev.inspection.total_images ?? prev.images.length) - removed,
              ),
            },
            images: remaining,
          };
        });

        setImageVersionBump((prev) => {
          const next = { ...prev };
          ids.forEach((id) => {
            delete next[id];
          });
          return next;
        });

        fetchResults();
      } catch (error) {
        console.error("Delete images failed:", error);
        alert("Delete images failed");
      } finally {
        setDeletingImageIds((prev) => {
          const next = { ...prev };
          ids.forEach((id) => {
            delete next[id];
          });
          return next;
        });
      }
    },
    [fetchResults, inspectionId],
  );

  const handleDeleteImage = useCallback(
    async (imageId: string) => handleDeleteImages([imageId]),
    [handleDeleteImages],
  );

  const handleUpdateManualAssessment = useCallback(
    async (imageId: string, payload: ManualAssessmentPayload) => {
      try {
        const response = await inspectionService.updateAssessment(imageId, payload);
        if (!response.ok) {
          alert(response.message || "Update assessment failed");
          return;
        }
        await fetchResults();
        refreshCacheKey();
      } catch (error) {
        console.error("Update assessment failed:", error);
        alert("Update assessment failed");
      }
    },
    [fetchResults, refreshCacheKey],
  );

  const handleUpdateBoundingBox = useCallback(
    async (imageId: string, boxIndex: number, updates: Partial<BBox>) => {
      try {
        const response = await inspectionService.updateAssessmentBox(imageId, {
          box_index: boxIndex,
          updates,
        });
        if (!response.ok) {
          alert(response.message || "Update bounding box failed");
          return;
        }
        await fetchResults();
        refreshCacheKey();
      } catch (error) {
        console.error("Update bounding box failed:", error);
        alert("Update bounding box failed");
      }
    },
    [fetchResults, refreshCacheKey],
  );

  const getImageStreamUrl = useCallback(
    (imageId: string, bump?: number) =>
      inspectionService.getImageStreamUrl(imageId, {
        cacheKey,
        bump,
      }),
    [cacheKey],
  );

  const refreshDetail = useCallback(() => {
    if (!inspectionId) return;
    fetchInspectionDetail(inspectionId);
    fetchResults();
  }, [fetchInspectionDetail, fetchResults, inspectionId]);

  useEffect(() => {
    if (!inspectionId) return;
    setDetail(null);
    setImageVersionBump({});
    fetchInspectionDetail(inspectionId);
    fetchResults();

    return () => {
      if (pollingRef.current !== null) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (bannerTimeoutRef.current !== null) {
        window.clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = null;
      }
    };
  }, [fetchInspectionDetail, fetchResults, inspectionId]);

  const allImagesAnalyzed = useMemo(() => {
    if (!detail) return false;
    const summary = detail.inspection.checked_summary;
    if (summary) {
      return summary.total > 0 && summary.checked === summary.total;
    }
    if (detail.images.length === 0) return false;
    return detail.images.every(
      (img) => normalizeChecklistStatus(img.status) === "checked",
    );
  }, [detail]);

  useEffect(() => {
    if (!inspectionId || !detail) {
      if (pollingRef.current !== null) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    if (allImagesAnalyzed) {
      if (pollingRef.current !== null) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const intervalId = window.setInterval(() => {
      fetchResults();
    }, RESULTS_POLL_INTERVAL);
    pollingRef.current = intervalId;

    return () => {
      if (pollingRef.current !== null) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [allImagesAnalyzed, detail, fetchResults, inspectionId]);

  useEffect(() => {
    if (!allImagesAnalyzed || !detail || detail.images.length === 0) {
      setAnalysisBannerVisible(false);
      if (bannerTimeoutRef.current !== null) {
        window.clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = null;
      }
      return;
    }

    setAnalysisBannerVisible(true);
    if (bannerTimeoutRef.current !== null) {
      window.clearTimeout(bannerTimeoutRef.current);
    }
    bannerTimeoutRef.current = window.setTimeout(() => {
      setAnalysisBannerVisible(false);
      bannerTimeoutRef.current = null;
    }, 4000);
  }, [allImagesAnalyzed, detail]);

  return (
    <InspectionDetailPage
      turbineId={turbineId}
      inspectionId={inspectionId}
      detail={detail}
      loadingDetail={loadingDetail}
      isAnalyzingAll={isAnalyzingAll}
      overallProgress={overallProgress}
      perImageAnalyzing={perImageAnalyzing}
      imageVersionBump={imageVersionBump}
      analysisBannerVisible={analysisBannerVisible}
      getImageStreamUrl={getImageStreamUrl}
      deletingImageIds={deletingImageIds}
      turbineName={turbineName}
      onAnalyzeAll={handleAnalyzeAllImages}
      onAnalyzeImage={handleAnalyzeImage}
      onDeleteImages={handleDeleteImages}
      onDeleteImage={handleDeleteImage}
      onUpdateManualAssessment={handleUpdateManualAssessment}
      onUpdateBoundingBox={handleUpdateBoundingBox}
      onRefreshDetail={refreshDetail}
      onRefreshResults={fetchResults}
      onDownloadReport={handleDownloadInspectionReport}
    />
  );
};

export default InspectionDetailLogic;
