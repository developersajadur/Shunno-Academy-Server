export interface ICreateModulePayload {
  courseId: string;
  moduleNumber: number;
  title: string;
  description?: string;
  order?: number;
}

export interface IUpdateModulePayload {
  title?: string;
  moduleNumber?: number;
  description?: string;
  order?: number;
}

export interface ICreateLecturePayload {
  moduleId: string;
  title: string;
  duration?: string;
  videoUrl: string;
  isPreview?: boolean;
  order?: number;
}

export interface IUpdateLecturePayload {
  title?: string;
  duration?: string;
  videoUrl?: string;
  isPreview?: boolean;
  order?: number;
}
