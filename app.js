(() => {
  'use strict';

  const STORAGE_KEY = 'monitor-comparison:monitors:v1';
  const ALIGN_KEY = 'monitor-comparison:alignment:v1';
  const COLOR_SLOTS = 8;

  const ALIGNMENTS = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];

  const PRESET_DEFAULTS = [
    { name: 'QHD 31.5"', resWidth: 2560, resHeight: 1440, diagonal: 31.5 },
    { name: 'WQHD 34"', resWidth: 3440, resHeight: 1440, diagonal: 34 },
  ];

  const els = {
    legend: document.getElementById('legend'),
    stage: document.getElementById('stage'),
    svg: document.getElementById('svg'),
    stageHint: document.getElementById('stage-hint'),
    list: document.getElementById('monitor-list'),
    tbody: document.getElementById('details-tbody'),
    alignGrid: document.getElementById('align-grid'),
    addBtn: document.getElementById('add-btn'),
    modalOverlay: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    form: document.getElementById('monitor-form'),
    cancelBtn: document.getElementById('cancel-btn'),
    saveBtn: document.getElementById('save-btn'),
    fId: document.getElementById('monitor-id'),
    fName: document.getElementById('f-name'),
    fPreset: document.getElementById('f-preset'),
    fWidth: document.getElementById('f-width'),
    fHeight: document.getElementById('f-height'),
    fDiagonal: document.getElementById('f-diagonal'),
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';

  let monitors = loadMonitors();
  saveMonitors();
  let alignment = loadAlignment();

  function loadAlignment() {
    const raw = localStorage.getItem(ALIGN_KEY);
    return ALIGNMENTS.includes(raw) ? raw : 'bottom-left';
  }

  function saveAlignment() {
    localStorage.setItem(ALIGN_KEY, alignment);
  }

  function uid() {
    return (crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }

  function loadMonitors() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedDefaults();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return seedDefaults();
      return parsed;
    } catch (e) {
      return seedDefaults();
    }
  }

  function seedDefaults() {
    return PRESET_DEFAULTS.map((p, i) => ({
      id: uid(),
      name: p.name,
      resWidth: p.resWidth,
      resHeight: p.resHeight,
      diagonal: p.diagonal,
      visible: true,
      colorSlot: i,
    }));
  }

  function saveMonitors() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(monitors));
  }

  function nextColorSlot() {
    if (monitors.length === 0) return 0;
    return Math.max(...monitors.map(m => m.colorSlot ?? 0)) + 1;
  }

  function colorVar(slot) {
    const idx = (slot % COLOR_SLOTS) + 1;
    return `var(--series-${idx})`;
  }

  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }

  function physical(m) {
    const diagPx = Math.sqrt(m.resWidth ** 2 + m.resHeight ** 2);
    const widthIn = m.diagonal * (m.resWidth / diagPx);
    const heightIn = m.diagonal * (m.resHeight / diagPx);
    const ppi = diagPx / m.diagonal;
    const pitchMm = 25.4 / ppi;
    const g = gcd(m.resWidth, m.resHeight) || 1;
    const ratio = `${m.resWidth / g}:${m.resHeight / g}`;
    return { widthIn, heightIn, ppi, pitchMm, ratio };
  }

  function fmt(n, digits = 1) {
    return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function render() {
    renderLegend();
    renderList();
    renderTable();
    renderAlign();
    renderStage();
  }

  const ALIGN_LABELS = {
    'top-left': 'Top left', 'top-center': 'Top center', 'top-right': 'Top right',
    'center-left': 'Center left', 'center': 'Center', 'center-right': 'Center right',
    'bottom-left': 'Bottom left', 'bottom-center': 'Bottom center', 'bottom-right': 'Bottom right',
  };

  function renderAlign() {
    if (els.alignGrid.childElementCount) return;
    ALIGNMENTS.forEach(key => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'align-cell';
      cell.setAttribute('aria-label', ALIGN_LABELS[key]);
      cell.setAttribute('aria-pressed', String(key === alignment));
      cell.dataset.align = key;
      const dot = document.createElement('span');
      dot.className = 'align-dot';
      cell.appendChild(dot);
      cell.addEventListener('click', () => {
        alignment = key;
        saveAlignment();
        updateAlignSelection();
        renderStage();
      });
      els.alignGrid.appendChild(cell);
    });
    updateAlignSelection();
  }

  function updateAlignSelection() {
    [...els.alignGrid.children].forEach(cell => {
      const isSelected = cell.dataset.align === alignment;
      cell.classList.toggle('is-selected', isSelected);
      cell.setAttribute('aria-pressed', String(isSelected));
    });
  }

  function renderLegend() {
    els.legend.innerHTML = '';
    monitors.forEach(m => {
      const item = document.createElement('span');
      item.className = 'legend-item';
      const swatch = document.createElement('span');
      swatch.className = 'legend-swatch';
      swatch.style.background = colorVar(m.colorSlot ?? 0);
      item.appendChild(swatch);
      const label = document.createElement('span');
      label.textContent = m.name;
      item.appendChild(label);
      els.legend.appendChild(item);
    });
  }

  function renderList() {
    els.list.innerHTML = '';
    if (monitors.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'stage-hint';
      empty.textContent = 'No monitors yet.';
      els.list.appendChild(empty);
      return;
    }
    monitors.forEach(m => {
      const p = physical(m);
      const card = document.createElement('div');
      card.className = 'monitor-card' + (m.visible ? '' : ' is-hidden');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = m.visible;
      cb.setAttribute('aria-label', `Show ${m.name} in comparison`);
      cb.addEventListener('change', () => {
        m.visible = cb.checked;
        saveMonitors();
        render();
      });
      card.appendChild(cb);

      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = colorVar(m.colorSlot ?? 0);
      card.appendChild(swatch);

      const info = document.createElement('div');
      info.className = 'info';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = m.name;
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${m.resWidth}×${m.resHeight} · ${m.diagonal}" · ${fmt(p.widthIn)}×${fmt(p.heightIn)} in · ${Math.round(p.ppi)} PPI`;
      info.appendChild(name);
      info.appendChild(meta);
      card.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'actions';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-ghost btn-icon';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openModal(m));
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-ghost btn-icon btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        if (confirm(`Delete "${m.name}"?`)) {
          monitors = monitors.filter(x => x.id !== m.id);
          saveMonitors();
          render();
        }
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);

      els.list.appendChild(card);
    });
  }

  function renderTable() {
    els.tbody.innerHTML = '';
    if (monitors.length === 0) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      const td = document.createElement('td');
      td.colSpan = 9;
      td.textContent = 'No monitors added yet.';
      tr.appendChild(td);
      els.tbody.appendChild(tr);
      return;
    }
    monitors.forEach(m => {
      const p = physical(m);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="swatch-cell" style="display:inline-block;background:${colorVar(m.colorSlot ?? 0)}"></span></td>
        <td>${escapeHtml(m.name)}</td>
        <td>${m.resWidth}×${m.resHeight}</td>
        <td>${p.ratio}</td>
        <td>${m.diagonal}"</td>
        <td>${fmt(p.widthIn)} in</td>
        <td>${fmt(p.heightIn)} in</td>
        <td>${Math.round(p.ppi)}</td>
        <td>${fmt(p.pitchMm, 3)} mm</td>
      `;
      els.tbody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderStage() {
    const visible = monitors.filter(m => m.visible);
    els.svg.innerHTML = '';
    const oldLabels = els.stage.querySelector('.labels-layer');
    if (oldLabels) oldLabels.remove();

    if (visible.length === 0) {
      els.stageHint.style.display = '';
      els.stageHint.textContent = monitors.length === 0
        ? 'Add a monitor to see it rendered to scale.'
        : 'No monitors are currently visible. Check a monitor in the list below.';
      return;
    }
    els.stageHint.style.display = 'none';

    const items = visible.map(m => ({ m, ...physical(m) }));
    const padLeft = 1, padRight = 1, padTop = 1.2, padBottom = 1;
    const maxW = Math.max(...items.map(i => i.widthIn));
    const maxH = Math.max(...items.map(i => i.heightIn));
    const vbW = maxW + padLeft + padRight;
    const vbH = maxH + padTop + padBottom;
    els.svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);

    const [vAlign, hAlign] = alignment === 'center' ? ['center', 'center'] : alignment.split('-');
    const boxX = (widthIn) => {
      if (hAlign === 'left') return padLeft;
      if (hAlign === 'right') return padLeft + (maxW - widthIn);
      return padLeft + (maxW - widthIn) / 2;
    };
    const boxY = (heightIn) => {
      if (vAlign === 'top') return padTop;
      if (vAlign === 'bottom') return padTop + (maxH - heightIn);
      return padTop + (maxH - heightIn) / 2;
    };

    const sorted = [...items].sort((a, b) => (b.widthIn * b.heightIn) - (a.widthIn * a.heightIn));

    const labelsLayer = document.createElement('div');
    labelsLayer.className = 'labels-layer';
    labelsLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    els.stage.style.position = 'relative';
    els.stage.appendChild(labelsLayer);

    const stageW = els.stage.clientWidth || 1;
    const stageH = els.stage.clientHeight || 1;
    const labelSpots = [];

    sorted.forEach(({ m, widthIn, heightIn }) => {
      const x = boxX(widthIn);
      const yTop = boxY(heightIn);
      const color = colorVar(m.colorSlot ?? 0);

      const halo = document.createElementNS(SVG_NS, 'rect');
      halo.setAttribute('x', x);
      halo.setAttribute('y', yTop);
      halo.setAttribute('width', widthIn);
      halo.setAttribute('height', heightIn);
      halo.setAttribute('rx', 0.12);
      halo.setAttribute('fill', 'none');
      halo.setAttribute('stroke', 'var(--surface-1)');
      halo.setAttribute('stroke-width', '6');
      halo.setAttribute('vector-effect', 'non-scaling-stroke');
      els.svg.appendChild(halo);

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', yTop);
      rect.setAttribute('width', widthIn);
      rect.setAttribute('height', heightIn);
      rect.setAttribute('rx', 0.12);
      rect.setAttribute('fill', color);
      rect.setAttribute('fill-opacity', '0.16');
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('vector-effect', 'non-scaling-stroke');
      els.svg.appendChild(rect);

      labelSpots.push({
        m, color,
        left: (x / vbW) * stageW,
        top: (yTop / vbH) * stageH,
      });
    });

    // Avoid overlapping labels: process top-to-bottom, push down any label
    // that would collide with the previous one.
    const MIN_GAP = 22;
    labelSpots.sort((a, b) => a.top - b.top);
    labelSpots.forEach((spot, i) => {
      if (i === 0) return;
      const prev = labelSpots[i - 1];
      if (spot.top < prev.top + MIN_GAP) spot.top = prev.top + MIN_GAP;
    });

    labelSpots.forEach(({ m, color, left, top }) => {
      const label = document.createElement('div');
      label.className = 'box-label';
      label.style.cssText = `position:absolute; left:${left}px; top:${top}px; transform: translate(6px, 6px); display:flex; align-items:center; gap:4px; font-size:0.72rem; font-weight:600; color:var(--text-primary); background:color-mix(in srgb, var(--surface-1) 80%, transparent); padding:2px 6px; border-radius:4px; white-space:nowrap; max-width:calc(100% - 12px); overflow:hidden; text-overflow:ellipsis;`;
      const dot = document.createElement('span');
      dot.style.cssText = `width:8px;height:8px;border-radius:2px;flex:none;background:${color};`;
      label.appendChild(dot);
      const text = document.createElement('span');
      text.textContent = m.name;
      label.appendChild(text);
      labelsLayer.appendChild(label);
    });
  }

  function openModal(monitor) {
    els.form.reset();
    if (monitor) {
      els.modalTitle.textContent = 'Edit monitor';
      els.saveBtn.textContent = 'Save changes';
      els.fId.value = monitor.id;
      els.fName.value = monitor.name;
      els.fWidth.value = monitor.resWidth;
      els.fHeight.value = monitor.resHeight;
      els.fDiagonal.value = monitor.diagonal;
      const presetVal = `${monitor.resWidth}x${monitor.resHeight}`;
      els.fPreset.value = [...els.fPreset.options].some(o => o.value === presetVal) ? presetVal : '';
    } else {
      els.modalTitle.textContent = 'Add monitor';
      els.saveBtn.textContent = 'Add monitor';
      els.fId.value = '';
    }
    els.modalOverlay.hidden = false;
    els.fName.focus();
  }

  function closeModal() {
    els.modalOverlay.hidden = true;
  }

  els.fPreset.addEventListener('change', () => {
    if (!els.fPreset.value) return;
    const [w, h] = els.fPreset.value.split('x').map(Number);
    els.fWidth.value = w;
    els.fHeight.value = h;
  });

  els.addBtn.addEventListener('click', () => openModal(null));
  els.cancelBtn.addEventListener('click', closeModal);
  els.modalOverlay.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.modalOverlay.hidden) closeModal();
  });

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = els.fId.value;
    const name = els.fName.value.trim();
    const resWidth = parseInt(els.fWidth.value, 10);
    const resHeight = parseInt(els.fHeight.value, 10);
    const diagonal = parseFloat(els.fDiagonal.value);

    if (!name || !resWidth || !resHeight || !diagonal) return;

    if (id) {
      const existing = monitors.find(m => m.id === id);
      if (existing) {
        existing.name = name;
        existing.resWidth = resWidth;
        existing.resHeight = resHeight;
        existing.diagonal = diagonal;
      }
    } else {
      monitors.push({
        id: uid(),
        name,
        resWidth,
        resHeight,
        diagonal,
        visible: true,
        colorSlot: nextColorSlot(),
      });
    }
    saveMonitors();
    closeModal();
    render();
  });

  window.addEventListener('resize', renderStage);

  render();
})();
