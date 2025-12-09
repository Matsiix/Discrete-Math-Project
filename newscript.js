// script.js
// Multi-file interactive demo with proof-like traces & animations.

// ======= Helpers =======
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function parseArrayInput() {
  const raw = $('arrayInput').value.trim();
  if (!raw) return [];
  return raw.split(',').map(s => Number(s.trim())).filter(x => !Number.isNaN(x));
}

function setTrace(text, kind='info') {
  const trace = $('trace');
  const span = document.createElement('div');
  span.className = 'entry ' + (kind === 'info' ? 'info' : kind);
  span.textContent = text;
  trace.prepend(span); // newest first
}

function clearTrace(){
  $('trace').textContent = '';
}

function setStats(obj) {
  const s = $('stats');
  const lines = [];
  for (const k in obj) lines.push(`${k}: ${obj[k]}`);
  s.innerHTML = lines.join('<br>');
}

// ======= Visual rendering =======
function renderArrayVisual(arr) {
  const container = $('arrayVisual');
  container.innerHTML = '';
  arr.forEach((v, idx) => {
    const el = document.createElement('div');
    el.className = 'array-item';
    el.dataset.index = idx;
    el.textContent = v;
    container.appendChild(el);
  });
}

function highlight(idx, cls, ms=300) {
  const container = $('arrayVisual');
  const el = container.children[idx];
  if (!el) return;
  el.classList.add(cls);
  setTimeout(()=> el.classList.remove(cls), ms+20);
}

// swap DOM elements visually with a small animation
async function animateSwap(i, j, delay) {
  const container = $('arrayVisual');
  const a = container.children[i];
  const b = container.children[j];
  if (!a || !b) return;

  // get positions
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();
  const dx = rectB.left - rectA.left;
  // apply transforms
  a.style.transition = `transform ${delay/1.5}ms`;
  b.style.transition = `transform ${delay/1.5}ms`;
  a.style.transform = `translateX(${dx}px)`;
  b.style.transform = `translateX(${-dx}px)`;
  a.classList.add('moving');
  b.classList.add('moving');

  await sleep(delay/1.5);

  // swap elements in DOM
  if (i < j) container.insertBefore(b, a);
  else container.insertBefore(a, b);

  // reset
  a.style.transform = '';
  b.style.transform = '';
  a.classList.remove('moving');
  b.classList.remove('moving');
  a.style.transition = '';
  b.style.transition = '';
}

// after algorithm completes, re-render to ensure indexes are consistent
function refreshArrayVisualFromData(arr) {
  renderArrayVisual(arr);
}

// ======= Controls =======
$('btnRender')?.addEventListener('click', ()=> {
  const arr = parseArrayInput();
  renderArrayVisual(arr);
  clearTrace();
  setStats({ 'n': arr.length });
  setTrace('Array rendered', 'info');
});

// speed
function getSpeed() {
  return Number($('speedSelect').value) || 200;
}

// ======= Algorithms with instrumentation & UI updates =======

/* ---------------- LINEAR SEARCH ---------------- */
async function runLinearSearch() {
  clearTrace();
  const arr = parseArrayInput();
  renderArrayVisual(arr);
  const targetVal = Number($('targetInput').value);
  let comps = 0;
  setTrace(`Running Linear Search for ${targetVal}`, 'info');

  for (let i=0;i<arr.length;i++){
    comps++;
    // highlight comparison
    highlight(i, 'highlight-comp', 300);
    setTrace(`Compare arr[${i}] (${arr[i]}) == ${targetVal}`, 'comp');
    await sleep(getSpeed());

    if (arr[i] === targetVal) {
      highlight(i, 'highlight-swap', 400);
      setTrace(`Found at index ${i}`, 'info');
      setStats({ 'comparisons': comps, 'result': `found at ${i}`, 'complexity': 'O(n)' });
      return;
    }
  }
  setTrace('Not found', 'info');
  setStats({ 'comparisons': comps, 'result': 'not found', 'complexity': 'O(n)' });
}

/* ---------------- BINARY SEARCH ---------------- */
async function runBinarySearch() {
  clearTrace();
  let arr = parseArrayInput();
  // sort for binary search, but show sorted order used
  arr = arr.slice().sort((a,b)=>a-b);
  renderArrayVisual(arr);
  const targetVal = Number($('targetInput').value);
  setTrace(`Running Binary Search for ${targetVal} on sorted array [${arr}]`, 'info');

  let L = 0, R = arr.length - 1;
  let comps = 0;

  while (L <= R) {
    const M = Math.floor((L+R)/2);
    comps++;
    highlight(M, 'highlight-comp', 300);
    setTrace(`Compare arr[${M}] (${arr[M]}) with ${targetVal}`, 'comp');
    await sleep(getSpeed());

    if (arr[M] === targetVal) {
      highlight(M, 'highlight-call', 400);
      setTrace(`Found at index ${M}`, 'info');
      setStats({ 'comparisons': comps, 'result': `found at ${M}`, 'complexity': 'O(log n)' });
      return;
    }
    if (arr[M] < targetVal) {
      setTrace(`arr[${M}] < ${targetVal} → search [${M+1}, ${R}]`, 'info');
      L = M + 1;
    } else {
      setTrace(`arr[${M}] > ${targetVal} → search [${L}, ${M-1}]`, 'info');
      R = M - 1;
    }
    await sleep(getSpeed()/2);
  }
  setTrace('Not found', 'info');
  setStats({ 'comparisons': comps, 'result': 'not found', 'complexity': 'O(log n)' });
}

/* ---------------- BUBBLE SORT ---------------- */
async function runBubbleSort() {
  clearTrace();
  let arr = parseArrayInput();
  renderArrayVisual(arr);
  const n = arr.length;
  let comps = 0, swaps = 0;
  setTrace('Running Bubble Sort', 'info');

  for (let i=0;i<n-1;i++){
    setTrace(`Pass ${i+1}`, 'info');
    for (let j=0;j<n-1-i;j++){
      comps++;
      highlight(j, 'highlight-comp', 220);
      highlight(j+1, 'highlight-comp', 220);
      setTrace(`Compare arr[${j}] (${arr[j]}) vs arr[${j+1}] (${arr[j+1]})`, 'comp');
      await sleep(getSpeed());

      if (arr[j] > arr[j+1]) {
        swaps++;
        setTrace(`Swap arr[${j}] and arr[${j+1}]`, 'swap');
        // animate swap between positions j and j+1
        await animateSwap(j, j+1, getSpeed());
        // swap in data model: since DOM swapped, just swap in array too
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
        await sleep(60);
      }
    }
  }
  refreshArrayVisualFromData(arr);
  setTrace(`Bubble Sort complete: [${arr}]`, 'info');
  setStats({ 'n': n, 'comparisons': comps, 'swaps': swaps, 'complexity': 'O(n²)' });
}

/* ---------------- MERGE SORT (with simple animation) ---------------- */
async function runMergeSort() {
  clearTrace();
  const arr = parseArrayInput();
  renderArrayVisual(arr);
  const counts = { calls:0, comparisons:0 };
  setTrace('Running Merge Sort', 'info');

  // We'll animate by highlighting ranges and re-rendering merged arrays
  const speed = getSpeed();
  const sorted = await mergeSortAnimated(arr.slice(), counts, speed);
  renderArrayVisual(sorted);
  setTrace(`Merge Sort complete: [${sorted}]`, 'info');
  setStats({ 'n': arr.length, 'recursive calls': counts.calls, 'merge comparisons': counts.comparisons, 'complexity': 'O(n log n)' });
}

async function mergeSortAnimated(arr, counts, speed) {
  counts.calls++;
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length/2);
  setTrace(`Split [${arr}] → L=[${arr.slice(0,mid)}], R=[${arr.slice(mid)}]`, 'call');
  // highlight subrange visually by re-rendering with color cues (quick approach)
  await showSubarrayHighlight(arr, 350);

  const left = await mergeSortAnimated(arr.slice(0,mid), counts, speed);
  const right = await mergeSortAnimated(arr.slice(mid), counts, speed);

  const merged = [];
  let i=0, j=0;
  while (i < left.length && j < right.length) {
    counts.comparisons++;
    setTrace(`Compare ${left[i]} and ${right[j]} for merge`, 'comp');
    // small highlight: render combined with current merge candidate highlighted
    await showMergeStep(left, right, i, j, 200);
    if (left[i] <= right[j]) {
      merged.push(left[i++]);
    } else {
      merged.push(right[j++]);
    }
    await sleep(80);
  }
  while (i < left.length) merged.push(left[i++]);
  while (j < right.length) merged.push(right[j++]);

  setTrace(`Merged → [${merged}]`, 'info');
  // show merged array in visual briefly
  await showTemporaryArray(merged, 250);
  return merged;
}

/* small helpers for merge visual feedback */
async function showSubarrayHighlight(arr, ms) {
  renderArrayVisual(arr);
  // highlight all items as a call
  const container = $('arrayVisual');
  Array.from(container.children).forEach(el => el.classList.add('highlight-call'));
  await sleep(ms);
  Array.from(container.children).forEach(el => el.classList.remove('highlight-call'));
}

async function showMergeStep(L, R, i, j, ms) {
  // render L then R visually separated
  const combined = [...L.slice(0,i).map(x=>'·'), ...L.slice(i), '|', ...R.slice(0,j).map(x=>'·'), ...R.slice(j)];
  // We won't show exact structure, but show a representation:
  renderArrayVisual([...L, '|', ...R]);
  // highlight candidates by index: left candidate index is i, right candidate index is L.length + 1 + j
  const container = $('arrayVisual');
  const leftIndex = i;
  const rightIndex = L.length + 1 + j;
  if (container.children[leftIndex]) container.children[leftIndex].classList.add('highlight-comp');
  if (container.children[rightIndex]) container.children[rightIndex].classList.add('highlight-comp');
  await sleep(ms);
  Array.from(container.children).forEach(el => el.classList.remove('highlight-comp'));
}

async function showTemporaryArray(arr, ms) {
  renderArrayVisual(arr);
  await sleep(ms);
}

// ======= button wiring =======
$('btnLinear').addEventListener('click', ()=> runLinearSearch().catch(e=>console.error(e)));
$('btnBinary').addEventListener('click', ()=> runBinarySearch().catch(e=>console.error(e)));
$('btnBubble').addEventListener('click', ()=> runBubbleSort().catch(e=>console.error(e)));
$('btnMerge').addEventListener('click', ()=> runMergeSort().catch(e=>console.error(e)));
