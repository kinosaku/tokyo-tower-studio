'use client';
import { useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Box, ChevronRight, Code2, Focus, Layers3, Maximize2, Minus, MousePointer2, Pause, Play, Plus, RotateCcw, ScanLine, TowerControl, X } from 'lucide-react';
import { TowerScene, type SceneHandle } from './tower-scene';
import { createTowerParts, type TowerPart, type TowerSectionId } from '../lib/tower-geometry';
import { sections } from '../lib/tower-sections';
import { useExplorerTools } from '../lib/use-explorer-tools';
const parts = createTowerParts();
const GITHUB = 'https://github.com/kinosaku/tokyo-tower-studio';

export default function Home() {
  const [section, setSection] = useState<TowerSectionId | null>(null);
  const [piece, setPiece] = useState<string | null>(null);
  const [explosion, setExplosion] = useState(0);
  const [isolated, setIsolated] = useState(false);
  const [labels, setLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mobilePanel, setMobilePanel] = useState<'parts' | 'detail' | null>(null);
  const scene = useRef<SceneHandle>(null);
  useExplorerTools({ section, piece, explosion, isolated, labels, autoRotate, wireframe }, next => {
    setSection(next.section); setPiece(next.piece); setExplosion(next.explosion); setIsolated(next.isolated); setLabels(next.labels); setAutoRotate(next.autoRotate); setWireframe(next.wireframe);
  });
  const selectedSection = sections.find(s => s.id === section);
  const selectedPart = parts.find(p => p.id === piece);
  const sectionParts = parts.filter(p => p.section === section);
  function selectSection(id: TowerSectionId | null) { setSection(id); setPiece(null); setIsolated(false); }
  function selectPart(part: TowerPart) { setSection(part.section); setPiece(part.id); setMobilePanel('detail'); }
  function reset() { selectSection(null); setExplosion(0); setAutoRotate(false); setWireframe(false); scene.current?.reset(); }
  function toggleIsolate() { setIsolated(v => !v); setExplosion(0); scene.current?.reset(); }
  function fullscreen() {
    setNotice('');
    if (document.fullscreenElement && document.exitFullscreen) void document.exitFullscreen().catch(() => setNotice('无法退出全屏，请使用浏览器的退出全屏按钮。'));
    else if (document.fullscreenEnabled && document.documentElement.requestFullscreen) void document.documentElement.requestFullscreen().catch(() => setNotice('当前浏览器未允许全屏，模型仍可正常操作。'));
    else setNotice('当前浏览器不支持全屏，模型仍可正常操作。');
  }
  return <main className="studio">
    <header className="topbar">
      <a className="brand" href="./" aria-label="Tokyo Tower Studio 首页"><span className="brand-icon"><TowerControl size={22} /></span><span>TOKYO TOWER <b>STUDIO</b></span></a>
      <div className="collection"><span className="live-dot" /> INTERACTIVE ARCHITECTURE <span className="collection-no">/ 001</span></div>
      <div className="header-actions"><span className="ai-badge">✦ AI 生成</span><a className="source-link" href={GITHUB} target="_blank" rel="noreferrer"><Code2 size={16} /><span>源码</span><ArrowUpRight size={14} /></a></div>
    </header>
    <div className="identity"><div className="eyebrow">日本 · 东京 · 1958</div><h1>TOKYO<br /><span>TOWER.</span></h1><div className="japanese">東京タワー <span>结构探索</span></div><div className="identity-rule" /></div>
    <section className="viewport" aria-label="3D 模型展示区">
      <TowerScene ref={scene} explosion={explosion} section={section} piece={piece} isolated={isolated} labels={labels} autoRotate={autoRotate} wireframe={wireframe} onSelect={selectPart} onReady={() => setReady(true)} onError={setError} />
      {!ready && !error && <div className="scene-status" role="status"><span className="loader" />正在搭建东京塔…</div>}
      {error && <div className="scene-error" role="alert"><p>{error}</p><button onClick={() => window.location.reload()}>重新载入</button></div>}
    </section>
    <aside className={`components-panel ${mobilePanel === 'parts' ? 'mobile-open' : ''}`} aria-label="建筑结构">
      <div className="panel-heading"><span>建筑结构</span><span className="count">07 SYSTEMS</span><button className="mobile-close" aria-label="关闭结构列表" onClick={() => setMobilePanel(null)}><X size={18} /></button></div>
      <button className={`overview-button ${section === null ? 'active' : ''}`} onClick={() => { selectSection(null); setMobilePanel(null); }}><Box size={17} /><span>完整建筑</span><span className="small-count">{parts.length}</span></button>
      <div className="section-list">{sections.map((s, index) => <button key={s.id} className={`section-button ${section === s.id ? 'active' : ''}`} aria-pressed={section === s.id} onClick={() => { selectSection(s.id); setMobilePanel(null); }}><span className="section-no">0{index + 1}</span><span>{s.name}</span><ChevronRight size={14} /></button>)}</div>
      <div className="parts-total"><span className="tiny-square" /><span><strong>{parts.length}</strong> 个独立几何部件</span><span className="available-dot" /></div>
    </aside>
    <aside className={`inspector ${mobilePanel === 'detail' ? 'mobile-open' : ''}`} aria-label="结构详情">
      <div className="inspector-top"><span className="eyebrow">{selectedSection ? selectedSection.en : 'THE TOKYO LANDMARK'}</span><button className="mobile-close" aria-label="关闭结构详情" onClick={() => setMobilePanel(null)}><X size={18} /></button><span className="inspector-symbol">{selectedSection ? String(sections.indexOf(selectedSection) + 1).padStart(2, '0') : '01 / JP'}</span></div>
      <h2>{selectedSection?.name ?? '一座城市的高度。'}</h2>
      <p className="description">{selectedSection?.description ?? '从地面的四个支点，到 333 米的红白塔尖。旋转、拆解，探索东京塔的结构之美。'}</p>
      {selectedSection ? <>
        <div className="detail-stat"><span>结构位置</span><strong>{selectedSection.height}</strong></div>
        <div className="detail-stat"><span>几何部件</span><strong>{sectionParts.length} <small>PIECES</small></strong></div>
        <div className="detail-note"><span>结构笔记</span><p>{selectedSection.detail}</p></div>
        <label className="piece-select-label" htmlFor="piece-select">探索单个部件</label>
        <select id="piece-select" value={piece ?? ''} onChange={e => setPiece(e.target.value || null)}><option value="">整个结构 · {sectionParts.length} 部件</option>{sectionParts.map(p => <option value={p.id} key={p.id}>{p.name} · {p.id}</option>)}</select>
        {selectedPart && <div className="selected-part"><span className="live-dot" /><span>{selectedPart.id}</span><button aria-label="取消单个部件选择" onClick={() => setPiece(null)}><X size={14} /></button></div>}
        <button className={`isolate-button ${isolated ? 'active' : ''}`} onClick={toggleIsolate}><Focus size={17} />{isolated ? '返回整体视图' : selectedPart ? '单独查看此部件' : '单独查看此结构'}<ArrowUpRight size={16} /></button>
      </> : <>
        <div className="hero-stat"><strong>333<span>m</span></strong><span>建筑总高度</span></div>
        <div className="facts-grid"><div><strong>150<span> m</span></strong><span>主展望台</span></div><div><strong>250<span> m</span></strong><span>顶层展望台</span></div></div>
        <div className="detail-note"><span>1958.12.23 · 竣工</span><p>国际橙与白色，开放的钢铁桁架。东京塔由建筑师内藤多仲设计。</p></div>
        <div className="interaction-note"><MousePointer2 size={17} /><span>点击塔身或左侧结构<br />开始探索每一个部件</span></div>
      </>}
      <div className="model-note">AI 生成 · 示意模型<br /><span>外观与构件划分为程序化重建</span></div>
    </aside>
    <div className="view-tools" role="toolbar" aria-label="相机与视图控制">
      <button title="放大" aria-label="放大模型" onClick={() => scene.current?.zoom(0.82)}><Plus size={19} /></button>
      <button title="缩小" aria-label="缩小模型" onClick={() => scene.current?.zoom(1.22)}><Minus size={19} /></button><span className="tool-divider" />
      <button title="重置视角" aria-label="重置视角" onClick={() => scene.current?.reset()}><Focus size={18} /></button>
      <button title="线框视图" aria-label="线框视图" aria-pressed={wireframe} className={wireframe ? 'active' : ''} onClick={() => setWireframe(v => !v)}><ScanLine size={18} /></button>
      <button title="全屏" aria-label="全屏" onClick={fullscreen}><Maximize2 size={17} /></button>
    </div>
    <div className="view-caption"><span className="live-dot" />{isolated ? 'ISOLATED VIEW' : explosion > 0 ? 'EXPLODED VIEW' : 'ASSEMBLED VIEW'}<span className="caption-divider" />{wireframe ? 'WIREFRAME' : 'PERSPECTIVE'}</div>
    {notice && <div className="notice" role="status">{notice}<button aria-label="关闭提示" onClick={() => setNotice('')}><X size={15} /></button></div>}
    <div className="mobile-tabs"><button aria-expanded={mobilePanel === 'parts'} onClick={() => setMobilePanel(v => v === 'parts' ? null : 'parts')}><Layers3 size={16} />结构</button><button aria-expanded={mobilePanel === 'detail'} onClick={() => setMobilePanel(v => v === 'detail' ? null : 'detail')}><Box size={16} />{selectedSection?.name ?? '建筑详情'}</button></div>
    <section className="explosion-dock" aria-label="拆解控制">
      <div className="dock-title"><Layers3 size={19} /><div><strong>结构拆解</strong><span>EXPLODE THE ARCHITECTURE</span></div></div>
      <div className="slider-area"><div className="slider-labels"><button onClick={() => setExplosion(0)}>组装完成</button><output htmlFor="explosion">{explosion}<span>%</span></output><button onClick={() => setExplosion(100)}>逐件展开 <ArrowUpRight size={12} /></button></div><input id="explosion" aria-label="结构拆解百分比" type="range" min="0" max="100" step="1" value={explosion} onChange={e => setExplosion(Number(e.target.value))} style={{ '--progress': `${explosion}%` } as React.CSSProperties} /><div className="slider-ticks"><span>0</span><span>结构分离</span><span>独立部件</span><span>100</span></div></div>
      <div className="dock-options"><button className={autoRotate ? 'active' : ''} aria-label={autoRotate ? '暂停自动旋转' : '自动旋转'} aria-pressed={autoRotate} onClick={() => setAutoRotate(v => !v)}>{autoRotate ? <Pause size={16} /> : <Play size={16} />}<span>旋转</span></button><label className="labels-toggle"><input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} /><span className="toggle-track" /><span>标注</span></label></div>
    </section>
    <footer className="footer"><span><MousePointer2 size={13} /> 拖动旋转 <span className="footer-dot">·</span> 滚轮缩放 <span className="footer-dot">·</span> 点击选择</span><button onClick={reset}><RotateCcw size={13} /> 重置工作室</button><span className="footer-right">TOKYO, JAPAN <ArrowDownLeft size={12} /></span></footer>
  </main>;
}
