import type { AxiosProgressEvent } from "axios";
import { api, type ApiResult } from "../core";
import { INSPECTIONS } from "../endpoints";
import { withApiBase } from "../../../shared/config/env";

export type InspectionSummary = {
  id: string;
  code?: string;
  name?: string;
  status?: string;
  total_images?: number;
  processed_images?: number;
  created_at?: string;
};

export type InspectionDetailResponse = {
  inspection: {
    id: string;
    turbine_id: string;
    status: string;
    total_images: number;
    processed_images: number;
  };
  images: Array<{
    id: string;
    file_name: string;
    blade: string;
    surface: string;
    status: string;
    file_url: string;
    assessments?: Array<{
      damage_grade?: number;
      ai_bounding_boxes: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        type?: string;
        confidence?: number;
        damage_grade?: number;
      }>;
      ai_damage_types?: string[];
      ai_confidence: number;
      grade_label?: string;
      grade_color?: string;
    }>;
  }>;
};

export type InspectionResultsResponse = {
  images: Array<{
    image_id: string;
    assessments: InspectionDetailResponse["images"][number]["assessments"] extends Array<
      infer Assessment
    >
      ? Assessment[]
      : never;
  }>;
};

export type UploadInspectionResponse = {
  inspection_id?: string;
  message?: string;
};

export type AnalyzeImageResponse = {
  message?: string;
  damage_assessments?: Array<{
    ai_confidence?: number;
    ai_bounding_boxes?: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type?: string;
      confidence?: number;
      damage_grade?: number;
    }>;
  }>;
};

export const inspectionService = {
  listByTurbine: (
    turbineId: string,
    signal?: AbortSignal
  ): Promise<ApiResult<InspectionSummary[]>> =>
    api.get(INSPECTIONS.LIST_BY_TURBINE(turbineId), { signal }),

  uploadZip: (
    turbineId: string,
    file: File,
    config?: {
      onUploadProgress?: (event: AxiosProgressEvent) => void;
    }
  ): Promise<ApiResult<UploadInspectionResponse>> => {
    const form = new FormData();
    form.append("file", file);
    return api.post(INSPECTIONS.UPLOAD_ZIP(turbineId), form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: config?.onUploadProgress,
    });
  },

  delete: (inspectionId: string): Promise<ApiResult<unknown>> =>
    api.delete(INSPECTIONS.DELETE(inspectionId)),

  detail: (
    inspectionId: string,
    signal?: AbortSignal
  ): Promise<ApiResult<InspectionDetailResponse>> =>
    api.get(INSPECTIONS.DETAIL(inspectionId), { signal }),

  results: (
    inspectionId: string,
    signal?: AbortSignal
  ): Promise<ApiResult<InspectionResultsResponse>> =>
    api.get(INSPECTIONS.RESULTS(inspectionId), { signal }),

  analyzeImage: (
    imageId: string
  ): Promise<ApiResult<AnalyzeImageResponse>> =>
    api.post(INSPECTIONS.ANALYZE_IMAGE(imageId)),

  getImageStreamUrl: (imageId: string, options?: { cacheKey?: string; bump?: number }) => {
    const base = withApiBase(INSPECTIONS.IMAGE_STREAM(imageId));
    const params = new URLSearchParams();
    if (options?.cacheKey) params.set("v", options.cacheKey);
    if (options?.bump && Number.isFinite(options.bump)) {
      params.set("b", String(options.bump));
    }
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  },
};
