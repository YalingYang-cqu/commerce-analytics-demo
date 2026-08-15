// ECharts 按需导入配置
import * as echarts from 'echarts/core'

// 导入图表类型
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  MapChart,
  CandlestickChart
} from 'echarts/charts'

// 导入组件
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkPointComponent,
  MarkLineComponent,
  ToolboxComponent,
  BrushComponent,
  GeoComponent,
  VisualMapComponent,
  GraphicComponent
} from 'echarts/components'

// 导入渲染器
import { CanvasRenderer } from 'echarts/renderers'

// 导入特性：LabelLayout 提供 series.labelLayout（含 moveOverlap 标签防重叠）能力。
// 按需构建下若不注册，生产环境 tree-shaking 会移除该能力，导致 labelLayout/moveOverlap 失效
// （表现为末端标签在 dev 正常、线上重叠）。
import { LabelLayout } from 'echarts/features'

// 注册必要的组件
echarts.use([
  // 图表类型
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  MapChart,
  CandlestickChart,

  // 组件
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkPointComponent,
  MarkLineComponent,
  ToolboxComponent,
  BrushComponent,
  GeoComponent,
  VisualMapComponent,
  GraphicComponent,

  // 特性
  LabelLayout,

  // 渲染器
  CanvasRenderer
])

// 导出 echarts 实例和类型
export { echarts }
export type { EChartsOption, BarSeriesOption } from 'echarts'

// 导出常用的图形工具
export const graphic = echarts.graphic
