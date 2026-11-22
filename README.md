# ⚔️ Arithma Knights - Tactical Arithmetic RPG

> **Tactical Arithmetic RPG / Medieval Fantasy Dungeon Crawler**  
> เกม RPG วางแผนเทิร์นเบสแนวคณิตศาสตร์ ที่เปลี่ยนตัวเลขและเครื่องหมายคำนวณให้เป็นพลังและกลยุทธ์การต่อสู้!  
> พัฒนาด้วย **HTML5 Canvas (2D) + Vanilla JavaScript (ES Modules) + HTML/CSS UI Overlay** โดยไม่มีการพึ่งพา Third-party Game Engine ใดๆ

---

## 🌟 จุดเด่นของเกม (Key Features)

- 🔢 **Tactical Arithmetic Combat:** อัศวินทั้ง 4 สังกัดเครื่องหมายคณิตศาสตร์พื้นฐาน ($-$, $\div$, $+$, $\times$) วางแผนจัดสรรทรัพยากรตัวเลขและ Action Points (3 AP)
- 🗺️ **Living Overworld Map & Territory Nodes:** แผนที่การเดินทาง 6 อาณาจักร พร้อมเอฟเฟกต์บรรยากาศ ป้ายนำทาง และระบบปลดล็อกด่านอัตโนมัติ
- 📜 **Corrupted Anomaly Bestiary:** หนังสือบันทึกและส่องข้อมูลข่าวกรองศัตรู (Dossier) พร้อมกราฟิก Procedural Canvas และสูตรคำนวณแบบเรียลไทม์
- 🦇 **Negative Number Anomalies:** ศัตรูจำนวนเต็มลบ เช่น *Negabat* ($-24$ HP) และ *Negabat Prime* ($-36$ HP) การโจมตีด้วยการลบจะยิ่งเพิ่มหนี้ ต้องใช้การหาร ($\div$) เพื่อบีบขนาด และการบวก ($+$) เพื่อล้างหนี้ให้กลับเป็น 0!
- 👾 **Epic Climactic Boss Encounters:**
  - **Big Int (Floor 5):** ไททันเลขฐานสอง 1,024 HP ที่ออกแบบมาเพื่อการคอมโบตัวคูณ Paladin แล้วใช้ Berserker ผ่าหารทำลายล้าง
  - **Factorio (Floor 6):** บอสคณิตศาสตร์ขั้นสูง $6! = 720 \text{ HP}$ เมื่อถูกโค่นจะยุบตัวลงตามลำดับแฟกทอเรียล $5! \rightarrow 4! \rightarrow 3! \rightarrow 2! \rightarrow 1! \rightarrow 0!$
- 🔮 **Sanctum of Mathematical Axioms:** ระบบ Roguelike Drafting หลังจบแต่ละด่าน เลือก 1 ใน 3 สัจพจน์และทฤษฎีบทคณิตศาสตร์เสริมแกร่งปาร์ตี้ (เช่น เกราะคูณศูนย์ $0 \cdot x = 0$, อนุพันธ์ AP $\frac{d}{dt}\text{AP}$, สูตรกำเนิดใหม่ $\lim_{t \to \infty}\text{Life}$)
- 🎵 **Procedural Web Audio API Synthesizer:** เสียงดาบฟัน, เวทมนตร์ฮีล, ระเบิด และชัยชนะ สังเคราะห์ขึ้นด้วยโค้ด Web Audio API สดๆ ไม่ต้องโหลดไฟล์เสียงภายนอก
- 🎯 **Fixed 1920×1080 Responsive Viewport:** เรนเดอร์บน Canvas ความละเอียดมาตรฐาน 16:9 ย่อ-ขยายตามหน้าจออัตโนมัติ

---

## ☁️ วิธีการ Deploy ขึ้น Vercel (Deployment Guide)

โปรเจกต์นี้เป็น **Pure Static Web App** (มี `index.html` อยู่ที่ Root) สามารถนำขึ้น Vercel ได้ทันทีโดย**ไม่ต้องตั้งค่า Build Command หรือติดตั้ง Framework เสริม**ครับ

### ทางเลือกที่ 1: ใช้ Vercel CLI (เร็วที่สุด ทำในเครื่องได้ทันที)

1. รันคำสั่งต่อไปนี้ใน Terminal / PowerShell ที่โฟลเดอร์โปรเจกต์:
   ```bash
   npx vercel
   ```
2. ตอบคำถามใน Terminal:
   - **Log in to Vercel:** ล็อกอินผ่านเบราว์เซอร์ (หากยังไม่ได้เข้าสู่ระบบ)
   - **Set up and deploy?**: พิมพ์ `y`
   - **Which scope?**: เลือก Account ของคุณ
   - **Link to existing project?**: พิมพ์ `N`
   - **Project's name?**: ตั้งชื่อโปรเจกต์ (เช่น `arithma-knights`) หรือกด Enter
   - **In which directory is your code located?**: กด Enter (ใช้ `./` ค่าเริ่มต้น)
   - **Want to modify settings?**: พิมพ์ `N`
3. ระบบจะทำการอัปโหลดและให้ Preview URL ทันที
4. เมื่อต้องการอัปเดตเวอร์ชันหลัก (Production) ให้รัน:
   ```bash
   npx vercel --prod
   ```

### ทางเลือกที่ 2: เชื่อมต่อผ่าน GitHub (แนะนำสำหรับ CI/CD อัปเดตอัตโนมัติ)

1. เตรียม Git Repository ในเครื่อง:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Arithma Knights"
   ```
2. สร้าง Repository บน [GitHub](https://github.com/new) แล้ว Push โค้ดขึ้นไป:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
3. เข้าสู่ [Vercel Dashboard](https://vercel.com/) -> กด **Add New...** -> เลือก **Project**
4. เลือก Git Repository ที่เพิ่ง push ไป
5. ที่หน้าตั้งค่า:
   - **Framework Preset:** เลือก `Other`
   - **Root Directory:** `./`
   - **Build and Output Settings:** ปล่อยว่างไว้ตามค่าเริ่มต้น
6. กด **Deploy** ตัวเกมจะออนไลน์พร้อมเล่นได้ทันทีภายในไม่กี่วินาที

---

## 🚀 วิธีการรันเล่นเกมในเครื่อง (Local Development)

> ⚠️ **ข้อสำคัญ (CORS Policy กับ ES Modules):**  
> เนื่องจากตัวเกมใช้ **JavaScript ES Modules (`import`/`export`)** หากเปิดไฟล์ `index.html` ด้วยการดับเบิ้ลคลิกตรงๆ (`file:///`) เบราว์เซอร์จะบล็อกการโหลดโมดูลตามนโยบายความปลอดภัย (CORS policy)  
> **จึงจำเป็นต้องรันผ่าน Local HTTP Web Server** โดยสามารถเลือกวิธีใดวิธีหนึ่งด้านล่างนี้:

### วิธีที่ 1: ใช้ VS Code Extension (ง่ายที่สุด)
1. ติดตั้งส่วนขยาย **[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)**
2. คลิกขวาที่ไฟล์ `index.html` ในโฟลเดอร์โปรเจกต์ แล้วเลือก **"Open with Live Server"**
3. เบราว์เซอร์จะเปิดเกมขึ้นมาอัตโนมัติที่ `http://127.0.0.1:5500`

### วิธีที่ 2: ใช้ Node.js / npx
```bash
# ใช้ npx serve
npx serve .

# หรือใช้ npx http-server
npx http-server -p 8080 -c-1
```
จากนั้นเปิดเบราว์เซอร์ไปที่ URL ที่ระบบแจ้ง (เช่น `http://localhost:3000` หรือ `http://localhost:8080`)

### วิธีที่ 3: ใช้ Python
```bash
python -m http.server 8000
```
จากนั้นเปิดเบราว์เซอร์ไปที่ `http://localhost:8000`

---

## 🎮 กฎการเล่น & กลไกเกม (Gameplay Mechanics)

### 1. ลูปการเล่นในแต่ละเทิร์น (Turn Flow)
1. **Roll Phase:** สุ่มหินตัวเลข 4 ก้อนลงบนถาดกองกลาง (Number Pool)
2. **Player Planning Phase (3 Action Points):**
   - **Equip หิน:** เลือกหินจาก Pool มอบให้อัศวิน (**ฟรี 0 AP!**)
   - **สั่ง Action:** คลิกที่อัศวินที่ถือหิน แล้วเลือกเป้าหมาย (ใช้ 1 AP)
   - **Real-time Preview:** นำเมาส์ไปชี้ที่เป้าหมายเพื่อดูตัวเลขคาดการณ์ความเสียหาย / การฮีลล่วงหน้า
   - **End Turn:** เมื่อใช้ AP ครบ หรือกดปุ่มจบรอบเพื่อส่งเทิร์นให้ศัตรู
3. **Enemy Phase:** ศัตรูที่รอดชีวิตจะผลัดกันโจมตีสวนกลับใส่อัศวินในทีม

### 2. บทบาทและพลังของ 4 อัศวิน (The 4 Knights)

| อัศวิน | เครื่องหมาย | บทบาท | รายละเอียดการทำงาน |
| :--- | :---: | :--- | :--- |
| **Knight** | **`−`** *(ลบ)* | **Direct Striker** | นำค่าหินที่ถือมาลบออกจาก HP ศัตรูโดยตรง เจาะเกราะแน่นอน |
| **Berserker** | **`÷`** *(หาร)* | **Heavy Buster** | นำ HP ปัจจุบันของศัตรูมาหารด้วยหินที่ถือ (ปัดเศษลง) ทรงพลังอย่างยิ่งกับศัตรู HP หลักร้อย/พัน |
| **Cleric** | **`+`** *(บวก)* | **Healer** | นำค่าหินที่ถือมาฟื้นฟูเลือดให้เพื่อนร่วมทีม และใช้ล้างหนี้ศัตรูจำนวนเต็มลบได้ |
| **Paladin** | **`×`** *(คูณ)* | **Empowerer** | ไม่สามารถถือหินได้เอง แต่มีตัวคูณสะสม (เริ่มต้น $\times 1$ เพิ่ม $+1$ ทุกรอบ สูงสุด $\times 3$) นำไปคูณเสริมพลังให้หินของเพื่อน |

### 3. ระบบอัปเกรดสัจพจน์ (Roguelike Axioms)
เมื่อชนะ Stage 1 ถึง 5 จะเข้าสู่ **Sanctum of Mathematical Axioms** เพื่อเลือก 1 ใน 3 ทฤษฎีบท:
- **Vitality Constant ($c_{\text{hp}}$):** เพิ่ม Max HP ของทุกคน +15 และฮีลทันที
- **Zero Barrier ($0 \cdot x = 0$):** มอบเกราะแสงคูณศูนย์ ป้องกันการโจมตีแรกของศัตรูในแต่ละด่านฟรี 1 ครั้ง
- **Calculus AP Booster ($\frac{d}{dt}\text{AP}$):** ในเทิร์นแรกของแต่ละด่าน ปาร์ตี้จะได้รับ 4 AP (จากเดิม 3 AP)
- **Rebirth Formula ($\lim_{t \to \infty}\text{Life}$):** ชุบชีวิตอัศวินที่ล้มลงเมื่อจบแต่ละด่านด้วย 50% HP
- **Euclidean Blade ($A - B$):** เพิ่มโบนัสดาเมจฟันลบของ Knight อีก +6 ดาเมจ
- **Harmonic Resonance ($1/n$):** เมื่อ Cleric ฮีล คลื่นฮาร์มอนิกจะกระจายฮีลให้อัศวินคนอื่นอีก +4 HP
- **Prime Cleave ($P_{\text{div}}$):** การหารของ Berserker รับประกันดาเมจขั้นต่ำไม่ต่ำกว่า 12 หน่วยเสมอ
- **Exponential Zeal ($\times 2^0$):** Paladin เริ่มต้นการต่อสู้ในแต่ละด่านด้วยตัวคูณ $\times 2$ ทันที
- **Infinity Number Well ($\infty_{\text{pool}}$):** ขยายสระสุ่มตัวเลขในแต่ละรอบจาก 4 ช่องเป็น 5 ช่อง
- **Pythagorean Bulwark ($a^2 + b^2$):** เมื่ออัศวินเลือดต่ำกว่า 30% จะได้รับเกราะลดดาเมจ 40%

---

## 🧪 การทดสอบระบบ (Running Tests)

โปรเจกต์มีชุดทดสอบ Unit/Integration Test ครอบคลุมตรรกะคณิตศาสตร์, ระบบเทิร์น, สกิลของ 4 อัศวิน, สูตรคะแนน, ศัตรูติดลบ และกลไกบอส Factorio:

```bash
node test_combat.js
```

ตัวอย่างผลการทดสอบ:
```text
--- Testing Arithma Knights Systems ---
✓ All 4 Knights initialized with correct HP
✓ Stage 1 enemies spawned correctly
✓ Pool rolled with 3 AP
✓ Paladin cannot hold numbers from pool (rejection confirmed)
✓ Knight executed subtraction attack!
✓ Berserker executed division attack!
✓ Cleric executed addition heal!
✓ Paladin empowered Knight!
✓ Stage Score Formula verified
✓ Factorio collapsed from 6! (720) -> 0! Defeated successfully!
🌟 ALL ARITHMA KNIGHTS TESTS PASSED PERFECTLY! 🌟
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Architecture)

```text
ArithmaKnight_Vibecode/
├── index.html              # คอนเทนเนอร์ Canvas (1920x1080) และ DOM UI Overlay ทั้งหมด
├── style.css               # เลย์เอาต์ธีม Medieval Fantasy, Responsive Viewport, แอนิเมชัน
├── test_combat.js          # ชุดทดสอบระบบตรรกะทางคณิตศาสตร์และการคำนวณ
├── .vercelignore           # กฎยกเว้นไฟล์สำหรับการ Deploy ขึ้น Vercel
├── README.md               # คู่มือการใช้งานและเอกสารแนะนำโปรเจกต์
├── docs/
│   └── GAME_SPEC.md        # เอกสาร Game Design Document & Architecture Spec
├── assets/                 # ภาพและทรัพยากรเสริม
└── src/
    ├── config.js           # ค่าคงที่และ Gameplay Balance ทั้งหมด (No Magic Numbers)
    ├── main.js             # Bootstrap Entry Point เริ่มต้นเกม
    ├── core/
    │   ├── Game.js         # Game Loop (requestAnimationFrame), State Machine, Scene Flow
    │   └── Input.js        # ตัวจัดการ Input แปลงพิกัด Screen สู่ Logical Canvas Space
    ├── entities/
    │   ├── Hero.js         # คลาสของ 4 อัศวิน (Knight, Berserker, Cleric, Paladin)
    │   └── Enemy.js        # คลาสมอนสเตอร์, มอนสเตอร์ติดลบ และบอส (Big Int, Factorio)
    ├── systems/
    │   ├── CombatSystem.js # ระบบประมวลผลการคำนวณคอมแบท, AP และผลลัพธ์การโจมตี
    │   ├── AxiomSystem.js  # ระบบสัจพจน์และทฤษฎีบท Roguelike Drafting & Perks
    │   ├── StageManager.js # ระบบจัดการด่าน (1–6) และสปอว์นศัตรู
    │   ├── ParticleSystem.js # เอฟเฟกต์อนุภาค การฟัน แสงเวทมนตร์ และตัวเลขลอยบน Canvas
    │   └── AudioSystem.js  # ซาวด์เอฟเฟกต์ Procedural Web Audio API
    └── ui/
        └── HUD.js          # จัดการ DOM UI, อัปเดตข้อมูลบนหน้าจอ, Event Listeners
```

---

## 📜 กฎเหล็กเชิงสถาปัตยกรรม (Architectural Guardrails)

1. **Zero External Game Engines:** ไม่พึ่งพา Phaser, PixiJS, Three.js หรือเอนจินขนาดใหญ่ รันได้เร็วและเบาที่สุด
2. **Strict UI Separation:** ตัว Canvas ทำหน้าที่เป็นตัววาดภาพโลก, อัศวิน, มอนสเตอร์ และอนุภาคเอฟเฟกต์เท่านั้น ข้อความ, ปุ่ม, การ์ด และหน้าต่างเมนูทั้งหมดสร้างด้วย HTML/CSS ผ่าน `src/ui/HUD.js`
3. **No Magic Numbers:** ค่าตัวเลขความเร็ว, สี, พลังชีวิต, สถิติตัวละคร และขนาดหน้าจอทั้งหมดรวมอยู่ที่ [src/config.js](file:///d:/ArithmaKnight_Vibecode/src/config.js)
4. **Resolution Normalization:** พิกัดเกมล็อกที่ 1920×1080 เสมอ และสเกลตามอัตราส่วน 16:9 แบบ Responsive ไม่ว่าผู้เล่นจะใช้หน้าจอขนาดใด
