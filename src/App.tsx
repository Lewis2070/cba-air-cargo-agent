import { useState } from 'react'

// Types
interface Flight {
  id: string
  flightNo: string
  route: string
  departureTime: string
  aircraft: string
  loadRate: number
  revenue: number
  weight: number
  capacity: number
  status: 'planned' | 'loading' | 'warning'
}

interface Cargo {
  id: string
  awbNo: string
  pieces: number
  weight: number
  volume: number
  shc: string
  dgrDetails: string
  status: 'unloaded' | 'loaded'
  shipper: string
  revenue: number
  isDgr: boolean
}

interface ULD {
  id: string
  type: string
  code: string
  weight: number
  cargoCount: number
  isExpanded: boolean
}

// Mock Data
const flights: Flight[] = Array.from({ length: 30 }, (_, i) => ({
  id: `${i + 1}`,
  flightNo: ['MU', 'CA', 'CZ', 'CX', 'SQ'][i % 5] + String(5000 + i),
  route: ['PVG→LAX', 'PVG→FRA', 'CAN→AMS', 'PVG→SYD', 'HKG→ORD'][i % 5],
  departureTime: ['23:55', '14:30', '01:15', '16:20', '22:10'][i % 5],
  aircraft: ['B77F', 'B744F', 'B763F'][i % 3],
  loadRate: Math.floor(Math.random() * 40) + 60,
  revenue: Math.floor(Math.random() * 30) + 80,
  weight: Math.floor(Math.random() * 50) + 50,
  capacity: 100,
  status: ['planned', 'loading', 'warning'][i % 3] as any
}))

const cargos: Cargo[] = [
  { id: 'C001', awbNo: '781-12345678', pieces: 25, weight: 1200, volume: 45, shc: 'RCS', dgrDetails: '', status: 'unloaded', shipper: '阿里巴巴', revenue: 25000, isDgr: false },
  { id: 'C002', awbNo: '781-23456789', pieces: 18, weight: 800, volume: 32, shc: '', dgrDetails: '', status: 'unloaded', shipper: '京东物流', revenue: 18000, isDgr: false },
  { id: 'C003', awbNo: '781-34567890', pieces: 10, weight: 450, volume: 18, shc: 'DGR', dgrDetails: 'UN3481', status: 'unloaded', shipper: '顺丰速运', revenue: 12000, isDgr: true },
  { id: 'C004', awbNo: '781-45678901', pieces: 50, weight: 2000, volume: 85, shc: 'ESH', dgrDetails: '', status: 'unloaded', shipper: '拼多多', revenue: 35000, isDgr: false },
  { id: 'C005', awbNo: '781-56789012', pieces: 80, weight: 3200, volume: 120, shc: 'DGR', dgrDetails: 'UN3171', status: 'unloaded', shipper: '宁德时代', revenue: 85000, isDgr: true },
  { id: 'C006', awbNo: '781-67890123', pieces: 5, weight: 200, volume: 5, shc: 'COL', dgrDetails: '2-8°C', status: 'unloaded', shipper: '辉瑞制药', revenue: 45000, isDgr: false },
]

const initialULDs: ULD[] = [
  { id: 'U001', type: 'Q6', code: 'AKE1234', weight: 850, cargoCount: 2, isExpanded: false },
  { id: 'U002', type: 'LD', code: 'PAG5678', weight: 620, cargoCount: 1, isExpanded: false },
]

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: '计划中', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  loading: { label: '装载中', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  warning: { label: '预警', color: 'text-rose-500', bg: 'bg-rose-500/10' },
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [currentPage, setCurrentPage] = useState<'flight' | 'load'>('flight')
  const [menuCollapsed, setMenuCollapsed] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [cargosList, setCargosList] = useState<Cargo[]>(cargos)
  const [ulds, setUlds] = useState<ULD[]>(initialULDs)
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const pageSize = 10

  const isDark = theme === 'dark'
  const totalPages = Math.ceil(flights.length / pageSize)
  const displayedFlights = flights.slice((currentPageNum - 1) * pageSize, currentPageNum * pageSize)

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')
  const toggleMenu = () => setMenuCollapsed(!menuCollapsed)

  const handleLoadClick = (flight: Flight) => {
    setSelectedFlight(flight)
    setCurrentPage('load')
  }

  const toggleCargoStatus = (cargoId: string) => {
    setCargosList(cargosList.map(c => c.id === cargoId ? { ...c, status: c.status === 'unloaded' ? 'loaded' : 'unloaded' } : c))
  }

  const toggleULD = (uldId: string) => {
    setUlds(ulds.map(u => u.id === uldId ? { ...u, isExpanded: !u.isExpanded } : u))
  }

  const loadedCount = cargosList.filter(c => c.status === 'loaded').length
  const loadedWeight = cargosList.filter(c => c.status === 'loaded').reduce((sum, c) => sum + c.weight, 0) / 1000

  return (
    <div className={`h-screen flex ${isDark ? 'bg-[#0d1117]' : 'bg-[#f8f9fa]'}`}>
      {/* Sidebar */}
      <aside className={`${menuCollapsed ? 'w-16' : 'w-56'} ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-r border-[#e1e4e8]'} border-r flex flex-col transition-all duration-300`}>
        <div className={`h-14 flex items-center justify-between px-4 border-b ${isDark ? 'border-[#30363d]' : 'border-[#e1e4e8]'}`}>
          {!menuCollapsed && <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>CBA智控</span>}
          <button onClick={toggleMenu} className={`p-1.5 rounded ${isDark ? 'hover:bg-[#30363d]' : 'hover:bg-gray-100'}`}>
            <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 p-2">
          {['航班工作台', 'AI排舱', '舱位预测', '合规检查', '订单管理', '特种货', '航班复盘'].map((label, idx) => (
            <button key={label} className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded transition-all ${
              idx === 0 ? (isDark ? 'bg-[#238636] text-white' : 'bg-[#2ea44f] text-white') : (isDark ? 'text-gray-400 hover:bg-[#21262d] hover:text-white' : 'text-gray-600 hover:bg-gray-100')
            }`}>
              <span>{['✈️', '🤖', '📊', '✅', '📋', '⚠️', '📈'][idx]}</span>
              {!menuCollapsed && <span className="text-sm font-medium">{label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`h-14 flex items-center justify-between px-6 border-b ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#e1e4e8]'}`}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded ${isDark ? 'bg-[#238636]' : 'bg-[#2ea44f]'} flex items-center justify-center`}>
                <span className="text-white font-bold">C</span>
              </div>
            </div>
            <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="text-sm">首页</span>
              <span>/</span>
              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>航班工作台</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className={`p-2 rounded ${isDark ? 'hover:bg-[#30363d] text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>2026-03-10 18:50</span>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-[#58a6ff]' : 'bg-[#0969da]'} flex items-center justify-center text-white font-medium`}>张</div>
              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>张伟</span>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className={`px-6 py-4 border-b ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#e1e4e8]'}`}>
          <div className="flex items-center gap-8">
            {[
              { label: '今日航班', value: '30', color: isDark ? '#58a6ff' : '#0969da' },
              { label: '预警航班', value: '8', color: '#f85149' },
              { label: '平均装载率', value: '78.5%', color: '#3fb950' },
              { label: '收益达成', value: '92.3%', color: '#d29922' },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="text-sm" style={{ color: stat.color }}>{stat.label}</div>
                <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentPage === 'flight' ? (
            <>
              {/* Flight Table */}
              <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#e1e4e8]'}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'bg-[#21262d] border-[#30363d]' : 'bg-[#f6f8fa] border-[#e1e4e8]'}`}>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>航班列表</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-[#30363d] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>30班</span>
                </div>
                <table className="w-full">
                  <thead className={isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}>
                    <tr className={`text-left text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <th className="px-4 py-3 font-medium">航班号</th>
                      <th className="px-4 py-3 font-medium">航线</th>
                      <th className="px-4 py-3 font-medium">起飞时间</th>
                      <th className="px-4 py-3 font-medium">机型</th>
                      <th className="px-4 py-3 font-medium">装载率</th>
                      <th className="px-4 py-3 font-medium">载量</th>
                      <th className="px-4 py-3 font-medium">收益</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedFlights.map((flight) => (
                      <tr key={flight.id} className={`border-t ${isDark ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#e1e4e8] hover:bg-gray-50'}`}>
                        <td className="px-4 py-3 font-semibold">{flight.flightNo}</td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{flight.route}</td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{flight.departureTime}</td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{flight.aircraft}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-24 h-2 ${isDark ? 'bg-[#30363d]' : 'bg-gray-200'} rounded-full`}>
                              <div className={`h-full rounded-full ${flight.loadRate >= 90 ? 'bg-green-500' : flight.loadRate >= 70 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${flight.loadRate}%` }}></div>
                            </div>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{flight.loadRate}%</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{flight.weight}/{flight.capacity}吨</td>
                        <td className={`px-4 py-3 ${flight.revenue >= 100 ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>{flight.revenue}%</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${statusMap[flight.status].bg} ${statusMap[flight.status].color}`}>{statusMap[flight.status].label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleLoadClick(flight)} className={`px-3 py-1.5 rounded text-sm ${isDark ? 'bg-[#238636] hover:bg-[#2ea043] text-white' : 'bg-[#2ea44f] hover:bg-[#2c974b] text-white'}`}>
                            排舱
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>共30条记录，第{currentPageNum}页，共{totalPages}页</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))} disabled={currentPageNum === 1} className={`px-3 py-1.5 rounded text-sm ${isDark ? 'bg-[#21262d] text-gray-400 hover:bg-[#30363d] disabled:opacity-50' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'}`}>上一页</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPageNum(page)} className={`w-8 h-8 rounded text-sm ${currentPageNum === page ? (isDark ? 'bg-[#58a6ff] text-white' : 'bg-[#0969da] text-white') : (isDark ? 'bg-[#21262d] text-gray-400 hover:bg-[#30363d]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))} disabled={currentPageNum === totalPages} className={`px-3 py-1.5 rounded text-sm ${isDark ? 'bg-[#21262d] text-gray-400 hover:bg-[#30363d] disabled:opacity-50' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'}`}>下一页</button>
                </div>
              </div>
            </>
          ) : (
            /* Load Planning - Three Columns */
            <div className="flex gap-4 h-full">
              /* Column 1: Cargo List */
              <div className={`w-80 flex flex-col rounded-lg border overflow-hidden ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#e1e4e8]'}`}>
                <div className={`px-4 py-3 border-b ${isDark ? 'border-[#30363d]' : 'border-[#e1e4e8]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>货物清单</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-[#30363d] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{cargosList.length}票</span>
                  </div>
                  <div className="flex gap-2">
                    <button className={`flex-1 px-2 py-1.5 rounded text-xs ${isDark ? 'bg-[#238636] text-white' : 'bg-[#2ea44f] text-white'}`}>按收益</button>
                    <button className={`flex-1 px-2 py-1.5 rounded text-xs ${isDark ? 'bg-[#21262d] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>按重量</button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {cargosList.map((cargo) => (
                    <div key={cargo.id} onClick={() => toggleCargoStatus(cargo.id)} className={`p-3 border-b cursor-pointer transition-colors ${isDark ? 'border-[#30363d] hover:bg-[#21262d]' : 'border-[#e1e4e8] hover:bg-gray-50'} ${cargo.status === 'loaded' ? (isDark ? 'bg-[#21262d]' : 'bg-blue-50') : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${cargo.status === 'loaded' ? (isDark ? 'bg-[#58a6ff] border-[#58a6ff]' : 'bg-[#0969da] border-[#0969da]') : (isDark ? 'border-[#30363d]' : 'border-gray-300')}`}>
                            {cargo.status === 'loaded' && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{cargo.awbNo}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${cargo.status === 'loaded' ? (isDark ? 'bg-[#238636] text-white' : 'bg-[#2ea44f] text-white') : (isDark ? 'bg-[#30363d] text-gray-400' : 'bg-gray-100 text-gray-600')}`}>{cargo.status === 'loaded' ? '已排舱' : '未排舱'}</span>
                      </div>
                      <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="flex justify-between"><span>件/重/体:</span><span>{cargo.pieces}件 / {cargo.weight}kg / {cargo.volume}m³</span></div>
                        <div className="flex justify-between"><span>SHC:</span><span>{cargo.shc || '-'}</span></div>
                        <div className="flex justify-between"><span>DGR:</span><span className={cargo.isDgr ? 'text-amber-500' : ''}>{cargo.dgrDetails || '-'}</span></div>
                        <div className="flex justify-between"><span>发货人:</span><span>{cargo.shipper}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              /* Column 2: ULD */
              <div className={`w-72 flex flex-col rounded-lg border overflow-hidden ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#e1e4e8]'}`}>
                <div className={`px-4 py-3 border-b ${isDark ? 'border-[#30363d]' : 'border-[#e1e4e8]'}`}>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>ULD打板区</span>
                </div>
                <div className="p-3 border-b border-[#30363d]">
                  <button className={`w-full py-2 rounded text-sm ${isDark ? 'bg-[#21262d] text-gray-300 hover:bg-[#30363d]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>+ 新建ULD</button>
                </div>
                <div className="flex-1 overflow-auto p-2">
                  <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-[#21262d]' : 'bg-gray-50'}`}>
                    <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>标准板型 (B777F)</div>
                    <div className="flex flex-wrap gap-2">
                      {['Q6', 'Q7', 'LD', 'AKE', 'PAG'].map(type => (
                        <button key={type} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-[#30363d] text-gray-300 hover:bg-[#484f58]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{type}</button>
                      ))}
                    </div>
                  </div>
                  {ulds.map((uld) => (
                    <div key={uld.id} className={`mb-2 rounded-lg border overflow-hidden ${isDark ? 'border-[#30363d]' : 'border-gray-200'}`}>
                      <div onClick={() => toggleULD(uld.id)} className={`px-3 py-2 cursor-pointer flex items-center justify-between ${isDark ? 'bg-[#21262d]' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{uld.type}</span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{uld.code}</span>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{uld.weight}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              /* Column 3: Aircraft Layout */
              <div className="flex-1 flex flex-col">
                <div className={`rounded-t-lg border p-4 ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#e1e4e8]'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setCurrentPage('flight')} className={`p-1 rounded ${isDark ? 'hover:bg-[#30363d] text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div>
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedFlight?.flightNo} {selectedFlight?.route}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedFlight?.aircraft} | {selectedFlight?.departureTime}起飞</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>装载率</span><div className="text-amber-500 font-bold">{selectedFlight?.loadRate}%</div></div>
                      <div><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>收益达成</span><div className="text-green-500 font-bold">{selectedFlight?.revenue}%</div></div>
                    </div>
                  </div>
                </div>
                <div className={`flex-1 rounded-b-lg border border-t-0 p-4 ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#e1e4e8]'}`}>
                  {['前货舱 (A)', '后货舱 (B)'].map((name, idx) => (
                    <div key={idx} className={`mb-4 p-3 rounded-lg border ${isDark ? 'border-[#30363d] bg-[#21262d]' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>0/51吨</span>
                      </div>
                      <div className={`h-8 rounded ${isDark ? 'bg-[#30363d]' : 'bg-gray-200'}`}>
                        <div className="h-full bg-blue-500 rounded-l" style={{ width: `${Math.random() * 30 + 10}%` }}></div>
                      </div>
                    </div>
                  ))}
                  <div className={`mt-auto p-3 rounded-lg border ${isDark ? 'border-amber-500/50 bg-amber-500/10' : 'border-amber-300 bg-amber-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>重心平衡</span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>正常范围内</span>
                    </div>
                  </div>
                </div>
                /* Stats & Actions */
                <div className={`mt-4 rounded-lg border p-4 ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#e1e4e8]'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-6">
                      <div><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已排货物</span><div className="font-bold">{loadedCount}票</div></div>
                      <div><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已排重量</span><div className="font-bold">{loadedWeight.toFixed(1)}吨</div></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className={`flex-1 py-2.5 rounded text-sm font-medium ${isDark ? 'bg-[#238636] hover:bg-[#2ea043] text-white' : 'bg-[#2ea44f] hover:bg-[#2c974b] text-white'}`}>保存方案</button>
                    <button className={`flex-1 py-2.5 rounded text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:shadow-lg`}>⚡ 一键排舱</button>
                    <button className={`px-4 py-2.5 rounded text-sm ${isDark ? 'bg-[#21262d] text-gray-400 hover:bg-[#30363d]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>重置</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
