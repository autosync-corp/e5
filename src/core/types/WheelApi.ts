export interface WheelApiParams {
  key: string;
  partNumbers: string[]; // Array of part numbers (partF, wheelPartR)
  includeDescription?: boolean;
  includeImage?: boolean;
  includeImageRotation?: boolean;
  includeInStock?: boolean;
  includeInventory?: boolean;
  includePrice?: boolean;
  includeSpecs?: boolean;
  includeTags?: boolean;
}

export interface WheelData {
  Accent?: string;
  BoltCircle1?: number;
  BoltCircle2?: number;
  Bore?: number;
  Brand?: string;
  Bsm?: string | null;
  Color?: string;
  Description?: string;
  Diameter?: number;
  ExposedLugs?: boolean;
  FaceStyle?: string;
  Finish?: string | null;
  Gtin?: string | null;
  Id?: number;
  Img0001?: string;
  Img0002?: string;
  Img0003?: string;
  Img0100?: string;
  Img0200?: string;
  Img0300?: string;
  Img1001?: string | null;
  ImgRotationDir?: string | null;
  InStock?: boolean;
  Inventory?: number;
  LipSize?: string | null;
  LoadRating?: number;
  LugCount?: number;
  LugType?: string;
  Material?: string;
  Model?: string;
  NicheTag?: string;
  Offset?: number;
  Orientation?: string;
  Pn?: string; // Part Number
  Position?: string;
  Price?: number;
  SegmentTags?: string[];
  ShortColor?: string;
  ShortFinish?: string | null;
  Structure?: string;
  StyleId?: number;
  Submodel?: string;
  Upc?: string;
  VehicleTypeTags?: string[];
  Weight?: number | null;
  Width?: number;
}

export interface WheelApiRawResponse {
  ImgUrlBase: string;
  MoreItems: boolean;
  RotationImgUrlBase: string;
  Wheels: WheelData[];
}

export interface WheelApiResponse {
  success: boolean;
  data?: WheelApiRawResponse;
  error?: string;
}
