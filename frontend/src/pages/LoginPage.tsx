import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Collapse, Typography, Tag, Space, Divider } from 'antd'
import { UserOutlined, LockOutlined, InfoCircleOutlined, HistoryOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

const VERSION = 'V5.3.3'
const BUILD_DATE = '2026-04-05'

const VERSION_FEATURES = [
  { tag: '新增', color: 'blue', items: [
    '全新三步排舱流程：货物列表 → ULD组板 → 飞机货舱装载',
    'IATA DGR 危险品隔离规则引擎（支持16类危险品）',
    'IATA 活体动物 / 生鲜货物隔离校验',
    'ULD板型通俗名称支持（Q7/Q6/AKE/AAU/PLA/AMU/AGK）',
    '3D ULD填充可视化（CSS 3D Transform）',
    '四区分离货舱布局（主舱M1-M11 / 鼻舱N1-N2 / 下舱前L1-L6 / 下舱后L7-L12）',
    'W&B 六线载重平衡包线图（波音授权参数）',
    'AI一键排舱（贪心算法 + 约束传播）',
    '排舱确认弹窗（含收益/风险/CG汇总）',
    '计费重量最大化算法（IATA体积重规则）',
    '实时重心（CG）动态预览，拖拽货物时自动更新包线图',
    '航班收益仪表板：单班收益、毛利率、载运率趋势图',
    'ULD混拼策略推荐（按目的港/航班自动分组）',
    '导出排舱结果为PDF报告（含货物明细+CG+收益）',
  ]},
  { tag: '修复', color: 'green', items: [
    '修复 v5.0 路由指向空壳页面问题',
    '修复智能排舱页面黑屏崩溃问题（TypeScript语法错误）',
    '修复重心计算逻辑（空载时CG估算）',
  ]},
  { tag: '优化', color: 'gold', items: [
    '货舱布局颜色分区，视觉清晰度提升',
    'DGR冲突实时告警，红框高亮提示',
    'AI排舱支持活体→下舱、生鲜→温控区的自动分配策略',
  ]},
]

const CHANGELOG = [
  { version: 'V5.3.3', date: '2026-04-05', note: 'Phase1两阶段合并：①ULD卡片默认折叠；②甲板颜色标识；③货物列表固定列；④修正版本号统一为V5.3.3' },
  { version: 'V5.3.2', date: '2026-04-04', note: '登录页VERSION/BUILD_DATE/CHANGELOG信息一致性修正；固化版本校验SOP' },
  { version: 'V5.3.0', date: '2026-04-01', note: '修复主菜单折叠功能，Header左侧新增折叠/展开按钮' },
  { version: 'V5.2', date: '2026-03-30', note: '智能排舱重大升级：三步流程、IATA规则引擎、AI排舱+W&B包线图' },
  { version: 'V5.0', date: '2026-03-26', note: 'B767-300BCF专业版：货舱布局图、六线包线图、ULD 3D可视化、主题切换' },
  { version: 'V4.1', date: '2026-03-24', note: '3D货舱可视化、手动+AI混合订舱模式、B767-300F配置' },
  { version: 'V4.0', date: '2026-03-20', note: '基础框架完成：登录、仪表板、订舱、航班、收益管理模块' },
]

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [versionOpen, setVersionOpen] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.email, values.password)
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.message || '登录失败'
      message.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 0',
      }}
    >
      {/* 版本标签 */}
      <div style={{ marginBottom: 8 }}>
        <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20 }}>
          {VERSION} · {BUILD_DATE}
        </Tag>
      </div>

      {/* 主登录卡片 */}
      <Card
        style={{ width: 380, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden' }}
        styles={{ body: { padding: '32px 28px' } }}
      >
        {/* Logo / 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>✈️</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1F4E79', letterSpacing: '1px' }}>
            CBA Air Cargo
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            国际货运智能管理系统
          </div>
          <Divider style={{ margin: '14px 0 0' }} />
        </div>

        {/* 登录表单 */}
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入账号邮箱' }]}
            initialValue="admin@cba.com"
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
              placeholder="账号邮箱"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            initialValue="Admin@2026"
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
              placeholder="密码"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8, marginTop: 20 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 44, borderRadius: 8, fontSize: 15, fontWeight: 600,
                background: 'linear-gradient(135deg, #1F4E79 0%, #2D6EBF 100%)',
                border: 'none', boxShadow: '0 4px 12px rgba(31,78,121,0.3)',
              }}
            >
              登录系统
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 版本说明折叠区 */}
      <Card
        style={{ width: 380, marginTop: 12, borderRadius: 12 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Collapse
          ghost
          expandIconPosition="end"
          onChange={() => setVersionOpen(!versionOpen)}
          style={{ background: 'transparent' }}
          expandIcon={({ isActive }) => null}
        >
          <Panel
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <InfoCircleOutlined style={{ color: '#667eea', fontSize: 13 }} />
                <span style={{ fontSize: 12, color: '#667eea', fontWeight: 600 }}>
                  {VERSION} 新特性 · {VERSION_FEATURES.reduce((s, f) => s + f.items.length, 0)}项更新
                </span>
                <span style={{ fontSize: 10, color: versionOpen ? '#667eea' : '#94A3B8', marginLeft: 'auto' }}>
                  {versionOpen ? '收起▲' : '展开▼'}
                </span>
              </div>
            }
            key="features"
            style={{ background: 'transparent' }}
          >
            {VERSION_FEATURES.map((feat, fi) => (
              <div key={fi} style={{ marginBottom: 12 }}>
                <Space size={4} style={{ marginBottom: 4 }}>
                  <Tag color={feat.color} style={{ fontSize: 10, margin: 0, borderRadius: 10 }}>{feat.tag}</Tag>
                </Space>
                <ul style={{ margin: '2px 0 0 0', paddingLeft: 16 }}>
                  {feat.items.map((item, i) => (
                    <li key={i} style={{ fontSize: 11.5, color: '#374151', marginBottom: 2, lineHeight: 1.5 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}

            <Divider style={{ margin: '10px 0' }} />

            {/* 历史版本 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <HistoryOutlined style={{ color: '#94A3B8', fontSize: 11 }} />
              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>历史版本</Text>
            </div>
            {CHANGELOG.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 11 }}>
                <Tag color={i === 0 ? 'purple' : 'default'} style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>{v.version}</Tag>
                <div>
                  <Text style={{ fontSize: 11, color: i === 0 ? '#374151' : '#94A3B8' }}>{v.note}</Text>
                  <Text style={{ fontSize: 10, color: '#CBD5E1', display: 'block' }}>{v.date}</Text>
                </div>
              </div>
            ))}
          </Panel>
        </Collapse>
      </Card>
    </div>
  )
}
