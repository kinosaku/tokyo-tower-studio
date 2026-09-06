import type { TowerSectionId } from './tower-geometry';

export const sections: { id: TowerSectionId; name: string; en: string; height: string; description: string; detail: string }[] = [
  { id: 'foundation', name: '基础与塔脚', en: 'FOUNDATIONS', height: 'GROUND LEVEL', description: '四个基础支点，将高耸的塔身稳稳落在地面。', detail: '四向展开的塔脚形成宽阔的支承面。本模型用独立基座示意基础位置，不包含地下结构。' },
  { id: 'legs', name: '四面支撑', en: 'LOWER PIERS', height: 'LOWER STRUCTURE', description: '向外舒展的四根支腿，勾勒出东京塔标志性的轮廓。', detail: '开放的桁架与交叉斜撑连接四面支腿。点击任意杆件，可以继续探索组成塔身的独立几何部件。' },
  { id: 'lower', name: '下部桁架', en: 'LOWER LATTICE', height: 'BELOW MAIN DECK', description: '细密的三角形桁架，向主展望台逐级收束。', detail: '重复的交叉杆件构成轻盈而通透的空间结构。拆解视图可展示这些杆件之间的组合关系。' },
  { id: 'main-deck', name: '主展望台', en: 'MAIN DECK', height: '150 m', description: '地上 150 米，东京塔的双层主展望台。', detail: '较宽的方形平台在纤细塔身上形成清晰的水平层次。模型以分段玻璃、框架和楼板示意两层展望空间。' },
  { id: 'upper', name: '上部桁架', en: 'UPPER LATTICE', height: 'ABOVE MAIN DECK', description: '红白相间的塔身，从主展望台延伸至高处。', detail: '东京塔使用国际橙和白色涂装。本模型保留渐细的轮廓与红白分带，局部比例经过适合交互展示的简化。' },
  { id: 'top-deck', name: '顶层展望台', en: 'TOP DECK', height: '250 m', description: '地上 250 米，更紧凑的顶层展望空间。', detail: '小巧的多边形平台环绕中心塔身，与下方主展望台形成鲜明的尺度对比。' },
  { id: 'spire', name: '天线与塔尖', en: 'ANTENNA & SPIRE', height: '333 m', description: '纤长的红白天线，将东京塔的轮廓延伸至 333 米。', detail: '分段天线、平台和支撑构成顶部的层次。此处为外观示意，不对应真实广播设备清单。' },
];
