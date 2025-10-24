import type { AxiosProgressEvent } from "axios";
import { api, type ApiResult } from "../core";
import { INSPECTIONS } from "../endpoints";
import { withApiBase } from "../../../shared/config/env";
import type {
  AnalyzeImageResponse,
  InspectionDetail,
  InspectionResults,
  ManualAssessmentPayload,
} from "../../../domain/inspections/models";
import type { BBox } from "../../../domain/inspections/models";

export type InspectionSummary = {
  id: string;
  inspection_code?: string;
  code?: string;
  name?: string;
  status?: string;
  operator?: string;
  equipment?: string;
  total_images?: number;
  processed_images?: number;
  created_at?: string;
};

export type UploadInspectionResponse = {
  inspection_id?: string;
  turbine_id?: string;
  inspection_code?: string;
  status?: string;
  total_images?: number;
  created_at?: string;
  message?: string;
};

export type DeleteImagesResponse = {
  message?: string;
  inspection_id?: string;
  deleted_count?: number;
  deleted_ids?: string[];
  remaining_images?: number;
};

export type UpdateAssessmentResponse = {
  message?: string;
  assessment?: {
    id: string;
    image_id: string;
    ai_bounding_boxes?: BBox[];
    description?: string;
    updated_at?: string;
  };
};

type ListOptions = {
  status?: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

type UploadOptions = {
  operator?: string;
  equipment?: string;
  captured_at?: string;
  onUploadProgress?: (event: AxiosProgressEvent) => void;
};

export const inspectionService = {
  listByTurbine: (
    turbineId: string,
    options?: ListOptions,
  ): Promise<ApiResult<InspectionSummary[]>> => {
    const params: Record<string, string | number> = {};
    if (options?.status && options.status !== "all") {
      params.status_filter = options.status;
    }
    if (typeof options?.limit === "number") {
      params.limit = options.limit;
    }
    if (typeof options?.offset === "number") {
      params.offset = options.offset;
    }

    const hasParams = Object.keys(params).length > 0;
    return api.get(INSPECTIONS.LIST_BY_TURBINE(turbineId), {
      params: hasParams ? params : undefined,
      signal: options?.signal,
    });
  },

  uploadZip: (
    turbineId: string,
    file: File,
    options?: UploadOptions,
  ): Promise<ApiResult<UploadInspectionResponse>> => {
    const form = new FormData();
    form.append("file", file);
    if (options?.operator) form.append("operator", options.operator);
    if (options?.equipment) form.append("equipment", options.equipment);
    if (options?.captured_at) form.append("captured_at", options.captured_at);

    return api.post(INSPECTIONS.UPLOAD_ZIP(turbineId), form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: options?.onUploadProgress,
    });
  },

  deleteInspection: (inspectionId: string): Promise<ApiResult<unknown>> =>
    api.delete(INSPECTIONS.DELETE(inspectionId)),

  detail: (
    inspectionId: string,
    signal?: AbortSignal,
  ): Promise<ApiResult<InspectionDetail>> =>
    api.get(INSPECTIONS.DETAIL(inspectionId), { signal }),

  results: (
    inspectionId: string,
    signal?: AbortSignal,
  ): Promise<ApiResult<InspectionResults>> =>
    api.get(INSPECTIONS.RESULTS(inspectionId), { signal }),

  analyzeImage: (imageId: string): Promise<ApiResult<AnalyzeImageResponse>> =>
    api.post(INSPECTIONS.ANALYZE_IMAGE(imageId)),

  deleteImages: (
    inspectionId: string,
    imageIds: string[],
  ): Promise<ApiResult<DeleteImagesResponse>> =>
    api.delete(INSPECTIONS.DELETE_IMAGES(inspectionId), {
      data: { image_ids: imageIds },
    }),

  deleteImage: (imageId: string): Promise<ApiResult<DeleteImagesResponse>> =>
    api.delete(INSPECTIONS.DELETE_IMAGE(imageId)),

  updateAssessment: (
    imageId: string,
    payload: ManualAssessmentPayload,
  ): Promise<ApiResult<UpdateAssessmentResponse>> =>
    api.patch(INSPECTIONS.UPDATE_ASSESSMENT(imageId), payload),

  updateAssessmentBox: (
    imageId: string,
    payload: {
      box_index: number;
      updates: Partial<BBox>;
    },
  ): Promise<ApiResult<UpdateAssessmentResponse>> =>
    api.patch(INSPECTIONS.UPDATE_ASSESSMENT_BOX(imageId), payload),

  getImageStreamUrl: (imageId: string, options?: { cacheKey?: string; bump?: number }) => {
    const base = withApiBase(INSPECTIONS.IMAGE_STREAM(imageId));
    const params = new URLSearchParams();
    if (options?.cacheKey) params.set("v", options.cacheKey);
    if (typeof options?.bump === "number") {
      params.set("b", String(options.bump));
    }
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  },

  getProcessedImageUrl: (imageId: string) =>
    withApiBase(INSPECTIONS.IMAGE_PROCESSED(imageId)),
};
