export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  confidence?: number;
  damage_grade?: number;
};

export type Assessment = {
  ai_confidence: number;
  ai_bounding_boxes: BBox[];
  ai_damage_types?: string[];
  damage_grade?: number;
  grade_label?: string;
  grade_color?: string;
  description?: string;
  damage_length_mm?: number;
  damage_width_mm?: number;
  damage_area_mm2?: number;
  pixel_to_mm_ratio?: number;
};

export type ImageItem = {
  id: string;
  blade: string;
  surface: string;
  file_name: string;
  status: string;
  file_url: string;
  processed_url?: string;
  checkedFlag?: string;
  assessments?: Assessment[];
};

export type InspectionDetail = {
  inspection: {
    id: string;
    turbine_id: string;
    inspection_code?: string;
    status: string;
    processing_status?: string;
    operator?: string;
    equipment?: string;
    total_images: number;
    processed_images?: number;
    created_at?: string;
    updated_at?: string;
    checked_summary?: {
      total: number;
      checked: number;
      unchecked: number;
      status: string;
    };
  };
  total_images?: number;
  images: ImageItem[];
};

export type InspectionResultsImage = {
  image_id: string;
  blade: string;
  surface: string;
  file_name: string;
  status?: string;
  file_url: string;
  assessments: Assessment[];
};

export type InspectionResults = {
  metadata: {
    inspection_id: string;
    inspection_code: string;
    status: string;
    processing_status?: string;
    total_images: number;
    processed_images: number;
    checked_summary?: {
      total: number;
      checked: number;
      unchecked: number;
      status: string;
    };
  };
  statistics: {
    total_images: number;
    analyzed_images: number;
    checked_images?: number;
    unchecked_images?: number;
  };
  images: InspectionResultsImage[];
};

export type AnalyzeImageResponse = {
  image_id?: string;
  status?: string;
  assessment_id?: string;
  damage_assessments: Assessment[];
  message?: string;
};

export type ManualAssessmentPayload = {
  description?: string;
  ai_bounding_boxes?: BBox[];
};

export type UpdateBoundingBoxPayload = {
  box_index: number;
  updates: Partial<BBox> & { type?: string };
};
