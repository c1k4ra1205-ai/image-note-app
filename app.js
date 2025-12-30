/* ===== 要素 ===== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const thumbGrid = document.getElementById("thumbGrid");
const listPage = document.getElementById("listPage");
const editPage = document.getElementById("editPage");
const toolBar = document.getElementById("toolBar");
const drawBtn = document.getElementById("drawBtn");
const choiceList = document.getElementById("choiceList");

/* ===== 状態 ===== */
let pages = [];
let current = 0;
let drawMode = false;
let drawing = false;
let penColor = "#000";
let penSize = 4;
let scale = 1;
let pointers = [], lastDist = null;

/* ===== 選択肢データ（保存可） ===== */
let choices = JSON.parse(localStorage.getItem("choices")) || [
  { title:"楽器", items:["Gt","Ba","Dr"] },
  { title:"アンプ", items:["Marshall","JC-120"] }
];

/* ===== 保存 ===== */
function save(){
  localStorage.setItem("pages",JSON.stringify(pages));
  localStorage.setItem("choices",JSON.stringify(choices));
}
(function load(){
  const d = localStorage.getItem("pages");
  if(d) pages = JSON.parse(d);
  refreshThumbs();
  refreshChoices();
})();

/* ===== Canvas ===== */
function resize(){
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  redraw();
}
window.onresize = resize;

/* ===== 画像追加 ===== */
fileInput.onchange = e =>{
  [...e.target.files].forEach(f=>{
    const r=new FileReader();
    r.onload=()=>{
      pages.push({img:r.result,draw:null});
      save();
      refreshThumbs();
    };
    r.readAsDataURL(f);
  });
};

/* ===== サムネ ===== */
function refreshThumbs(){
  thumbGrid.innerHTML="";
  pages.forEach((p,i)=>{
    const d=document.createElement("div");
    d.className="thumb";
    d.draggable=true;
    d.ondragstart=e=>e.dataTransfer.setData("i",i);
    d.ondragover=e=>e.preventDefault();
    d.ondrop=e=>{
      const f=e.dataTransfer.getData("i");
      pages.splice(i,0,pages.splice(f,1)[0]);
      save(); refreshThumbs();
    };
    const img=new Image();
    img.src=p.img;
    img.onclick=()=>{current=i;showEdit();};
    d.appendChild(img);
    thumbGrid.appendChild(d);
  });
}

/* ===== ページ切替 ===== */
listBtn.onclick = ()=>{ editPage.classList.add("hidden"); listPage.classList.remove("hidden"); };
function showEdit(){
  listPage.classList.add("hidden");
  editPage.classList.remove("hidden");
  scale=1;
  setTimeout(resize,0);
}

/* ===== 描画 ===== */
function redraw(){
  if(!pages[current])return;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const img=new Image();
  img.onload=()=>{
    const r=Math.min(canvas.width/img.width,canvas.height/img.height)*scale;
    const w=img.width*r,h=img.height*r;
    const x=(canvas.width-w)/2,y=(canvas.height-h)/2;
    ctx.drawImage(img,x,y,w,h);
    if(pages[current].draw){
      const d=new Image();
      d.onload=()=>ctx.drawImage(d,x,y,w,h);
      d.src=pages[current].draw;
    }
  };
  img.src=pages[current].img;
}

/* ===== 手書き & ズーム ===== */
canvas.onpointerdown=e=>{
  pointers.push(e);
  if(drawMode&&pointers.length===1){
    ctx.strokeStyle=penColor;
    ctx.lineWidth=penSize;
    ctx.lineCap="round";
    ctx.beginPath();
    ctx.moveTo(e.offsetX,e.offsetY);
    drawing=true;
  }
};
canvas.onpointermove=e=>{
  pointers=pointers.map(p=>p.pointerId===e.pointerId?e:p);
  if(pointers.length===2){
    const d=Math.hypot(
      pointers[0].clientX-pointers[1].clientX,
      pointers[0].clientY-pointers[1].clientY
    );
    if(lastDist){scale*=d/lastDist;redraw();}
    lastDist=d;
  }
  if(drawing){
    ctx.lineTo(e.offsetX,e.offsetY);
    ctx.stroke();
  }
};
canvas.onpointerup=()=>{
  pointers=[]; lastDist=null;
  if(drawing){
    drawing=false;
    pages[current].draw=canvas.toDataURL();
    save();
  }
};

/* ===== ツール ===== */
drawBtn.onclick=()=>{
  drawMode=!drawMode;
  drawBtn.classList.toggle("active",drawMode);
  toolBar.classList.toggle("hidden",!drawMode);
};
document.querySelector(".black").onclick=()=>penColor="#000";
document.querySelector(".red").onclick=()=>penColor="#E53935";
document.querySelector(".blue").onclick=()=>penColor="#1E88E5";
penSize.oninput=e=>penSize=e.target.value;

/* ===== 選択肢 ===== */
function refreshChoices(){
  choiceList.innerHTML="";
  choices.forEach(g=>{
    const h=document.createElement("h4");
    h.textContent=g.title;
    choiceList.appendChild(h);
    g.items.forEach(t=>{
      const b=document.createElement("button");
      b.className="choiceBtn";
      b.textContent=t;
      b.onclick=()=>addText(t);
      choiceList.appendChild(b);
    });
  });
}
function addText(t){
  const d=document.createElement("div");
  d.className="textItem";
  d.textContent=t;
  d.style.left="50%";
  d.style.top="50%";
  drag(d);
  editPage.appendChild(d);
}
function drag(el){
  el.onpointerdown=e=>{
    const ox=e.offsetX,oy=e.offsetY;
    document.onpointermove=ev=>{
      el.style.left=ev.pageX-ox+"px";
      el.style.top=ev.pageY-oy+"px";
    };
    document.onpointerup=()=>document.onpointermove=null;
  };
}
