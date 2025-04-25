export interface IPageTemplate {
  id: number;
  name: string;
  alias: string;
  designer: string;
  demoUrl?: string;
  visible: boolean;
  title: string;
  metaDescription: string;
  introText: string;
  fullText: string;
  typeId: number;
  params: string;
  ownerId?: number;
  ordering: number;
  usage: number;
  minSites?: any;
  imported: number;
  version: number;
  global: boolean;
  image: string;
  imageS: string;
  imageM: string;
  imageL: string;
  imageXL: string;
  templateType?: any;
  tags: any[];
}
