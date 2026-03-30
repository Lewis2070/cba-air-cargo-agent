
    const nUI: UI[] = [];
    const mp = [...getMainDeckPositions(), ...getLowerFwdPositions(), ...getLowerAftPositions()];
    sorted.forEach(c => {
      const deck = c.category === 'live_animal' || c.category === 'perishable' ? 'lower' : 'main';
      const ex = nUI.find(x => x.deck === deck && x.cargoItems.reduce((s, i) => s + i.weight_kg, 0) + c.weight_kg <= 5000 && x.cargoItems.length < 10);
      if (ex) { ex.cargoItems.push(c); }
      else {
        const code = deck === 'main' ? 'LD-6' : 'LD-3';
        nUI.push({
          id: 'AI-' + Date.now() + '-' + nUI.length,
          uld_code: code, uld_name: deck === 'main' ? 'Q6' : 'AKE',
          uld_full_name: deck === 'main' ? 'LD-6(AKE)' : 'LD-3(AKE)',
          uld_serial: 'LD' + String(counter + nUI.length).padStart(3, '0'),
          cargoItems: [c], deck, dims: { l_cm: 0, w_cm: 0, h_cm: 0 }, max_load_kg: 0, volume_m3: 0,
        });
      }
    });
    nUI.forEach((u, i) => { if (mp[i]) u.position = mp[i].code; });
    setConfirmPlan(buildPlan(nUI));
    setConfirmMode('ai');
    setConfirmOpen(true);
  };

  const handleManualConfirm = () => {
    if (!ulds.length) { message.warning('请先组板'); return; }
    setConfirmPlan(buildPlan(ulds));
    setConfirmMode('manual');
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!confirmPlan) return;
    setUlds(confirmPlan.ulds);
    setConfirmOpen(false);
    message.success('排舱方案已提交生效');
  };

  const openUldModal = (u: UI) => setModalUld(u);
  const closeUldModal = () => setModalUld(null);

  const cgR = useMemo(() => {
    const p = ulds.filter(u => u.position).map(u => ({
      weight_kg: u.cargoItems.reduce((s, c) => s + c.weight_kg, 0),
      position_code: u.position!,
    }));
    return calculateCG(p);
  }, [ulds]);

  const allCargo = ulds.flatMap(u => u.cargoItems);
  const placedUlds = ulds.filter(u => u.position);

  return (
    <div style={{ padding: 12 }}>
      {/* Header toolbar */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap',
        background: '#fff', padding: '8px 12px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <Text style={{ fontSize: 15, fontWeight: 700, color: '#1F4E79', marginRight: 4 }}>🛩️ CBA v5.2 智能排舱</Text>
        <Select
          size="small" placeholder="+添加ULD板型" style={{ width: 160 }}
          onChange={v => addUld(v as string)}
          options={[
            { value: 'LD-7', label: 'LD-7 Q7/RAP 主舱' },
            { value: 'LD-6', label: 'LD-6 Q6/AKE 主舱' },
            { value: 'LD-3', label: 'LD-3 AKE 下舱' },
          ]}
        />
        <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={aiPack}>AI排舱</Button>
        <Button size="small" icon={<CheckCircleOutlined />} onClick={handleManualConfirm}
          style={{ background: '#16A34A', borderColor: '#16A34A', color: '#fff' }}>完成排舱</Button>
        <Button size="small" icon={<ReloadOutlined />}
          onClick={() => { setUlds([]); setCounter(1); message.info('已重置'); }}>重置</Button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 11 }}>装<b style={{ color: '#059669' }}> {allCargo.length} </b>件</Text>
          <Text style={{ fontSize: 11 }}>ULD<b style={{ color: placedUlds.length === ulds.length && ulds.length > 0 ? '#16A34A' : '#F59E0B' }}> {placedUlds.length}/{ulds.length} </b>个</Text>
          <Text style={{ fontSize: 11 }}>收入<b style={{ color: '#16A34A' }}> ¥{allCargo.reduce((s, c) => s + c.chargeableWeight_kg * c.fee_per_kg, 0).toLocaleString()} </b></Text>
          <Text style={{ fontSize: 11 }}>CG <b style={{ color: cgR.status === 'ok' ? '#16A34A' : '#DC2626' }}>{cgR.cg_mac_pct}%</b></Text>
        </div>
      </div>

      {/* DGR warnings */}
      {warns.length > 0 && (
        <Alert type="error" icon={<ExclamationCircleOutlined />} message="DGR冲突"
          description={warns.slice(0, 3).join('；')} closable style={{ marginBottom: 8 }} />
      )}

      {/* Three column layout */}
      <Row gutter={8}>
        <Col span={8}><CargoListPanel list={d} ulds={ulds} onDrag={handleCargoDrag} /></Col>
        <Col span={8}><ULDBuildPanel ulds={ulds} onRemove={removeUld} onCargoRemove={removeCargoFromUld} onDrop={handleUldDrop} onOpenModal={openUldModal} /></Col>
        <Col span={8}><AircraftHoldWithSwap ulds={ulds} onSlotDrop={handleUldSlotDrop} onEmptySlotClick={handleEmptySlotClick} /></Col>
      </Row>

      {/* ULD detail modal */}
      <Modal open={!!modalUld} title={
        <Space>
          <Text style={{ fontSize: 14, fontWeight: 700, color: '#1F4E79' }}>🔍 ULD大图查看</Text>
          {modalUld && <Tag color="blue" style={{ margin: 0 }}>{modalUld.uld_serial || modalUld.uld_code}</Tag>}
        </Space>
      } onCancel={closeUldModal} footer={null} width={780} destroyOnClose>
        {modalUld && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}><ULD3DView uld={modalUld} onRemove={() => {}} compact={false} /></div>
            <div style={{ width: 260 }}>
              <Card size="small" title="货物清单" styles={{ body: { padding: 8 } }}>
                {modalUld.cargoItems.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #F8FAFC' }}>
                    <div>
                      <Text style={{ fontSize: 10, fontWeight: 600, color: CC[c.category], display: 'block' }}>{c.awb}</Text>
                      <Text style={{ fontSize: 9.5, color: '#374151' }}>{c.description}</Text>
                      <Text style={{ fontSize: 9, color: '#94A3B8' }}>{c.length_cm}×{c.width_cm}×{c.height_cm}cm | {c.weight_kg}kg</Text>
                    </div>
                    <Tag color={CC[c.category]} style={{ fontSize: 9, flexShrink: 0 }}>{CT[c.category].t}</Tag>
                  </div>
                ))}
                {modalUld.cargoItems.length === 0 && <Text style={{ fontSize: 11, color: '#94A3B8' }}>暂无货物</Text>}
              </Card>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm plan modal */}
      <ConfirmModal
        open={confirmOpen} plan={confirmPlan} mode={confirmMode}
        onConfirm={handleConfirm}
        onCancel={() => { setConfirmOpen(false); setConfirmPlan(null); message.info('方案已取消'); }}
      />
    </div>
  );
}
