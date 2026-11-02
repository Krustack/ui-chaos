# AGENT.md

คู่มือสำหรับ AI agent (และคนที่เข้ามาร่วมพัฒนา) ของโปรเจกต์นี้
อ่านไฟล์นี้ให้จบก่อนแก้โค้ดทุกครั้ง

---

## 1. โปรเจกต์นี้คืออะไร

เว็บเกมมัลติเพลเยอร์ที่รันบนเบราว์เซอร์ โดยผสมแนวคิดสองอย่างเข้าด้วยกัน:

- **สไตล์ User Inyerface**: หน้าฟอร์ม/UI ที่ตั้งใจออกแบบให้ใช้งานยาก หลอกตา และน่าหงุดหงิด (dark pattern, ปุ่มหลอก, กฎแปลกๆ) ผู้เล่นต้องผ่านด่านต่างๆ ให้ได้
- **เล่นพร้อมกันแบบ Kahoot**: Host สร้างเกม ได้รหัสห้อง (PIN) ผู้เล่นเข้าร่วมด้วย PIN + ชื่อเล่น แล้วเริ่มเล่นพร้อมกัน
- **คะแนน realtime**: ผู้เล่นสะสมคะแนนไปเรื่อยๆ ระหว่างเล่น Host เห็นกระดานคะแนนอัปเดตสดๆ

### กติกาที่ตกลงแล้ว

| เรื่อง | ข้อสรุป |
|--------|---------|
| ผู้เล่นสูงสุด | **50 คนต่อเกม** |
| เกมจบเมื่อ | **ผู้เล่น 5 คนแรกที่ผ่านครบทุกด่านเสร็จ → เกมหยุดทันที** (ดูข้อ 4) ไม่มี time limit รวมของเกม |
| โบนัสเข้าเส้นชัย | คนที่ผ่านครบทุกด่านได้โบนัสตามลำดับ: **ที่ 1 = +5, ที่ 2 = +4, ที่ 3 = +3, ที่ 4 = +2, ที่ 5 = +1** (ดูข้อ 7) |
| ลำดับด่าน | **ผู้เล่นทุกคนเจอด่านลำดับเดียวกัน** (ลำดับและ seed เดียวกันทั้งเกม) |
| จำนวนด่าน | **5 ด่าน (stage)** ตายตัว |
| คะแนนต่อด่าน | **ด่านละ 10 คะแนน** ผ่านด่านได้ 10 เท่ากันทุกด่าน **ไม่มี time bonus และไม่มี wrong penalty** (ตอบผิดไม่หักคะแนน) คะแนนเต็มจากด่าน = 50 + โบนัสเข้าเส้นชัยสูงสุด 5 = 55 |
| ตอบผิด | **ตอบผิดได้ไม่จำกัดครั้ง** ไม่หักคะแนน แต่ **ห้ามกดรัว**: cooldown 1.5 วินาทีต่อการ submit (ดูข้อ 7) |
| ผู้เล่นเห็นอะไร | **เห็นเฉพาะคะแนนของตัวเอง** ไม่เห็นคะแนน/อันดับของคนอื่น ตารางอันดับแสดงที่หน้า Host เท่านั้น |
| ที่รัน | **ทุกอย่างอยู่บน Vercel** (ไม่มี server แยก ไม่ใช้บริการ realtime ภายนอก) |
| ข้อมูล | **ไม่ถาวร** ลบทิ้งเมื่อ Host เริ่มเกมใหม่ |

### บทบาท

| บทบาท | Authen | ทำอะไร |
|-------|--------|--------|
| **Host** | **ต้อง login** (มีคนเดียว คือเจ้าของโปรเจกต์) | สร้างเกม, ดูรายชื่อผู้เล่น, เริ่ม/จบเกม, ดู leaderboard realtime (ไม่เล่นเอง) |
| **Player** | **ไม่ต้อง login** | เข้าห้องด้วย PIN + ชื่อเล่น, เล่นด่าน, สะสมคะแนน, เห็นคะแนนตัวเอง |

---

## 2. Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework / Hosting | **Next.js** (App Router) + TypeScript (`strict`) deploy บน **Vercel** |
| Realtime | **Socket.IO** รันเป็น **Vercel Function** (WebSocket บน Vercel) |
| Socket.IO adapter | `@socket.io/redis-adapter` + `ioredis` เชื่อม Upstash ผ่าน TCP (`rediss://`) |
| ฐานข้อมูล | **Upstash Redis** ผ่าน `@upstash/redis` (REST) — **ไม่ถาวร** |
| Styling | **CSS Modules เท่านั้น** (`*.module.css`) ห้ามใช้ Tailwind / styled-components / CSS-in-JS |
| Auth | Host คนเดียว ใช้รหัสผ่านจาก env + cookie session (ข้อ 8) |
| Test | Vitest (unit) + Playwright (e2e หลายผู้เล่น) |

### Socket.IO บน Vercel (สถานะ ณ 2 พ.ย. 2026)

Vercel Functions รองรับ WebSocket แบบ **GA ตั้งแต่ 20 ต.ค. 2026** ใช้ได้ทุกแพ็กเกจ และ **ต้องเปิด Fluid compute** ไว้ Socket.IO ใช้ได้โดย endpoint เป็น Vercel Function ตัวหนึ่ง ไม่ต้องมี server แยก

ตัวอย่างตามเอกสาร Vercel (ตรวจกับเอกสารล่าสุดก่อนเขียนจริง: https://vercel.com/docs/functions/websockets):

```ts
// api/socket-io.ts  (ฝั่ง server)
import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer();
const io = new Server(server);
// ... ผูก adapter + handlers ตรงนี้
export default server;
```

```ts
// src/lib/socket-client.ts  (ฝั่ง client)
import { io } from 'socket.io-client';

export const socket = io('https://<your-domain>', {
  // Socket.IO ต่อท้าย /socket.io ให้เอง path เต็มจึงเป็น /api/socket-io/socket.io
  path: '/api/socket-io/socket.io',
  transports: ['websocket'], // จำเป็น: ค่าเริ่มต้นของ client คือ HTTP long-polling ซึ่งใช้ไม่ได้ที่นี่
});
```

> ฟีเจอร์นี้ใหม่ — โค้ดตัวอย่างด้านบนเป็นเพียงโครง ให้ agent อ่านเอกสารจริงก่อนเขียนและทดสอบบน Vercel Preview จริง ไม่ใช่แค่ local

### ข้อจำกัดที่ต้องออกแบบรองรับ (สำคัญมาก)

เอกสาร Vercel ระบุว่า: **หนึ่ง connection ถูกตรึงอยู่กับ Function instance เดียว** และ **connection ใหม่ไม่รับประกันว่าจะไปลง instance เดิม** ดังนั้นผู้เล่น 50 คน + Host อาจกระจายอยู่หลาย instance ผลที่ตามมา:

1. **ห้ามเก็บ state ไว้ในหน่วยความจำ** (ตัวแปร global, `Map`) ทุกอย่างอ่าน/เขียนผ่าน Redis
2. **ต้องใช้ Redis adapter** ไม่เช่นนั้น `io.to(room).emit(...)` จะถึงแค่ socket ที่อยู่ instance เดียวกัน (เช่น ผู้เล่นได้คะแนนที่ instance A แต่ Host อยู่ instance B จะไม่เห็น)
3. **connection อาจหลุดได้ทุกเมื่อ** (Function มี limit ของมัน — ตรวจ `maxDuration` ของแพ็กเกจ และ deploy ใหม่ก็ตัด connection) → client ต้อง **reconnect อัตโนมัติ + กู้สถานะ** (`player:rejoin` / `host:watch`) โดยทุกอย่างอยู่ใน Redis จึงกู้ได้
4. **ห้ามใช้ `setInterval` / `setTimeout`** ฝั่ง server เพื่อทำ logic เกม
5. Rate limit ทำผ่าน Redis (`@upstash/ratelimit`) ไม่ใช่ในหน่วยความจำ

ข้อควรตรวจก่อนใช้งานจริง:
- Upstash TCP: ตรวจว่าแพ็กเกจรองรับ pub/sub และจำนวน connection (แต่ละ instance ใช้ ~2 connection สำหรับ adapter) พอสำหรับ 50 ผู้เล่น
- Vercel: ราคา Active CPU / จำนวน connection และ `maxDuration` ของแพ็กเกจที่ใช้

---

## 3. โครงสร้างโปรเจกต์

```
/
├─ AGENT.md
├─ middleware.ts                 # ป้องกันหน้า /host/* (ยกเว้น /host/login)
├─ api/
│  └─ socket-io.ts               # Vercel Function: Socket.IO server (ข้อ 2)
├─ .env.local                    # ไม่ commit
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                # หน้าแรก: Join (Player) / Host login
│  │  ├─ join/page.tsx           # กรอก PIN + ชื่อ
│  │  ├─ play/page.tsx           # หน้าเล่นของ Player
│  │  ├─ host/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ page.tsx             # dashboard: สร้างเกมใหม่
│  │  │  └─ game/page.tsx        # lobby + scoreboard realtime
│  │  └─ api/host/login/route.ts # POST login / DELETE logout (HTTP เท่านั้น)
│  ├─ components/                # UI ทั่วไป (+ *.module.css ข้างไฟล์)
│  ├─ challenges/
│  │  └─ <challengeId>/
│  │     ├─ index.tsx
│  │     └─ styles.module.css
│  ├─ lib/
│  │  ├─ redis.ts                # Upstash REST client (singleton)
│  │  ├─ socket-client.ts        # socket.io-client singleton + auto reconnect
│  │  └─ auth.ts                 # sign/verify host session (jose)
│  ├─ server/                    # โค้ดฝั่ง server เท่านั้น (ห้าม import เข้า client component)
│  │  ├─ socket-handlers.ts      # ลงทะเบียน event ทั้งหมด
│  │  ├─ game.ts                 # state machine + resetGame()
│  │  ├─ scoring.ts
│  │  └─ validators/<challengeId>.ts
│  └─ shared/
│     ├─ events.ts               # type ของ event + payload (ใช้ร่วมสองฝั่ง)
│     └─ challenges.ts           # metadata ของทุกด่าน
└─ tests/
```

กฎ:
- type ของ event และ payload อยู่ใน `src/shared/events.ts` ที่เดียว
- CSS: ไฟล์ `*.module.css` วางข้างคอมโพเนนต์ ใช้ชื่อ class แบบ camelCase; ตัวแปรสี/ฟอนต์ส่วนกลางเก็บเป็น CSS variables ใน `src/app/globals.css`

---

## 4. Flow ของเกม

```
(ไม่มีเกม) → LOBBY → PLAYING → FINISHED → (Host สร้างเกมใหม่ = ลบข้อมูลเก่าทั้งหมด)
```

มี **เกมที่ active ได้ครั้งละหนึ่งเกมเท่านั้น** (Host มีคนเดียว) เก็บ PIN ปัจจุบันไว้ที่ `game:current`

1. Host login แล้วกด "สร้างเกมใหม่" → server **ลบข้อมูลเกมเก่าทั้งหมด** แล้วสร้างเกมใหม่ + PIN 6 หลัก สถานะ `LOBBY`
2. ผู้เล่นกรอก PIN + ชื่อ → ได้ `playerId` + `playerToken` (เก็บใน `localStorage`) ชื่อซ้ำในเกมเดียวกันต้องปฏิเสธ และ **รับได้ไม่เกิน 50 คน** (คนที่ 51 ได้ error `ROOM_FULL`)
3. Host เห็นรายชื่อผู้เล่นเพิ่มขึ้นสดๆ แล้วกด "เริ่มเกม"
4. สถานะเป็น `PLAYING` server กำหนด `startAt` ผู้เล่นทุกคนเริ่มพร้อมกันตาม `startAt`
5. ผู้เล่นทุกคนเล่นด่านตามลำดับเดียวกัน (`challengeOrder` เดียวทั้งเกม) แต่แต่ละคนเดินหน้าด้วยความเร็วของตัวเอง ผ่านด่านแล้วได้คะแนนทันที ไม่ต้องรอคนอื่น ผู้เล่นเห็นคะแนนสะสมของตัวเองเท่านั้น
6. Host ดู leaderboard อัปเดตตลอด
7. **ผู้เล่นที่ผ่านครบทุกด่านจะถูกมาร์กว่า `finished`** และได้ลำดับการเข้าเส้นชัย (`finishRank` = 1, 2, 3, ...) จาก counter ใน Redis และได้โบนัสตามลำดับ (ที่ 1–5 = +5, +4, +3, +2, +1) ผู้เล่นเห็นหน้า "เสร็จแล้ว" + คะแนนตัวเอง
8. **เกมจบ (`FINISHED`) ทันทีที่มีผู้เล่น finished ครบ 5 คน** (`FINISH_LIMIT = 5` เป็นค่าคงที่ใน `src/shared/challenges.ts` หรือไฟล์ config เดียว)
   - ถ้าผู้เล่นในเกมน้อยกว่า 5 คน ให้จบเมื่อทุกคน finished (เงื่อนไขจริง: `finishedCount >= min(5, playerCount)`)
   - Host กด "จบเกม" เองได้เสมอ (เผื่อมีคนหลุด/ทิ้งเกม)
   - เมื่อเกมจบ ผู้เล่นที่ยังเล่นไม่เสร็จจะหยุดเล่นทันที (submit หลังจากนั้นได้ `GAME_ENDED`) และเห็นหน้า "เกมจบแล้ว" พร้อมคะแนนตัวเองเท่านั้น
   - Host เห็นอันดับสุดท้าย ข้อมูลยังอยู่จนกว่าจะสร้างเกมใหม่

---

## 5. ข้อมูลใน Upstash Redis (ชั่วคราว ไม่ถาวร)

ข้อมูลทั้งหมดเป็นของเกมเดียวที่ active และ **ถูกลบเมื่อเริ่มเกมใหม่** ไม่มีประวัติเกมเก่า ไม่มีตารางผู้ใช้

| Key | ชนิด | เก็บอะไร |
|-----|------|----------|
| `game:current` | String | PIN ของเกมปัจจุบัน |
| `game:{pin}` | Hash | `status`, `createdAt`, `startAt`, `seed` |
| `game:{pin}:players` | Hash | `playerId` → JSON `{ name, token, joinedAt, finished }` |
| `game:{pin}:count` | String (counter) | จำนวนผู้เล่น (ใช้บังคับ limit 50 แบบ atomic: `INCR` แล้วถ้าเกิน 50 ให้ `DECR` คืนและปฏิเสธ) |
| `game:{pin}:finished` | String (counter) | จำนวนผู้เล่นที่ผ่านครบทุกด่านแล้ว — `INCR` แบบ atomic คืนค่าเป็น `finishRank` ของคนนั้น ถ้า ≤ 5 ถือว่าเป็นหนึ่งใน 5 คนแรก และเมื่อได้ค่าเท่ากับ `min(5, playerCount)` ให้จบเกม |
| `game:{pin}:names` | Set | ชื่อที่ใช้แล้ว (lowercase) ไว้ตรวจชื่อซ้ำ |
| `game:{pin}:scores` | **Sorted Set** | member = `playerId`, score = คะแนนรวม (`ZINCRBY`, `ZREVRANGE ... WITHSCORES`) |
| `game:{pin}:done:{playerId}` | Set | `challengeId` ที่ผ่านแล้ว (กัน submit ซ้ำ) |
| `game:{pin}:progress:{playerId}` | Hash | `currentIndex` (ด่านปัจจุบัน 0–4) |
| `game:{pin}:lastScoredAt` | Hash | `playerId` → timestamp ที่ได้คะแนนล่าสุด (ใช้ tie-break) |
| `game:{pin}:keys` | Set | **ทะเบียนของ key ทั้งหมดของเกมนี้** ใช้ตอนลบ |

### การลบข้อมูลเกมเก่า (`resetGame()` ใน `src/server/game.ts`)

1. อ่าน PIN เก่าจาก `game:current`
2. อ่านรายการ key จาก `game:{oldPin}:keys`
3. `DEL` ทุก key เป็น pipeline เดียว แล้วลบ `game:current`
4. สร้างเกมใหม่ตั้งแต่ศูนย์ และส่ง `game:reset` ให้ socket ที่ยังเชื่อมอยู่ (ผู้เล่นเก่าจะถูกพากลับหน้า Join)

กฎ:
- **ทุกครั้งที่สร้าง key ใหม่ ต้องลงทะเบียนใน `game:{pin}:keys`** เพื่อให้ลบได้ครบ (ห้ามใช้ `KEYS *` หรือ `FLUSHALL`)
- ตั้ง **TTL สำรอง** (เช่น 12 ชั่วโมง) ให้ทุก key เป็น safety net เผื่อ Host ไม่ได้เริ่มเกมใหม่
- ใช้ Sorted Set ทำ leaderboard ไม่ต้อง sort เองในโค้ด
- ตรวจ "ผ่านด่านซ้ำ" ด้วย `SADD` (คืนค่า 0 = เคยผ่านแล้ว ไม่ให้คะแนนซ้ำ) กัน race condition
- รวมคำสั่งที่เกี่ยวข้องเป็น pipeline เพื่อประหยัด request
- ห้ามเก็บคำตอบที่ถูกไว้ในที่ client เข้าถึงได้

---

## 6. Realtime Protocol (Socket.IO)

ทุกการกระทำของ Host/Player (ยกเว้น login) วิ่งผ่าน socket โดยใช้ **ack callback** ตอบผลทันที handler ทุกตัวอ่าน/เขียน Redis ล้วนๆ และ broadcast ผ่าน Redis adapter

### Client → Server

| Event | Payload | ใช้โดย | หมายเหตุ |
|-------|---------|--------|----------|
| `host:create` | `{}` | Host | ลบเกมเก่า + สร้างใหม่ → ack `{ pin }` |
| `host:watch` | `{}` | Host | เข้า room ของ Host + ขอ snapshot (ใช้ตอน reconnect) |
| `host:start` | `{}` | Host | เริ่มเกม |
| `host:end` | `{}` | Host | จบเกมเอง |
| `player:join` | `{ pin, name }` | Player | ack `{ playerId, playerToken }` หรือ error |
| `player:rejoin` | `{ playerId, playerToken }` | Player | กู้สถานะหลังรีเฟรช/หลุด |
| `player:submit` | `{ challengeId, answer }` | Player | ack `{ correct, pointsAwarded, totalScore, next }` หรือ `{ error: 'TOO_FAST', retryAfterMs }` เมื่อกดถี่เกิน (ข้อ 7) |

### Server → Client

| Event | Payload | ส่งถึง |
|-------|---------|--------|
| `players:update` | `{ players: [{id, name, finished}] }` | Host room |
| `game:started` | `{ startAt, challengeOrder, seed }` | ทั้งเกม |
| `leaderboard:update` | `{ ranking: [{id, name, score, challengesDone, finished}] }` | **Host room เท่านั้น** |
| `game:ended` | `{}` (Host ได้ `finalRanking` เพิ่ม) | ทั้งเกม |
| `game:reset` | `{}` | ทั้งเกม (เกมเก่าถูกลบ) |
| `error:message` | `{ code, message }` | ผู้ส่ง |

กฎ:
- Socket.IO rooms: `game:{pin}` (ทุกคน) และ `host:{pin}` (Host เท่านั้น) — **ข้อมูลคะแนนของคนอื่นห้ามส่งเข้า room ที่ Player อยู่เด็ดขาด** (Player ได้คะแนนตัวเองผ่าน ack ของ `player:submit` เท่านั้น)
- เมื่อมีคนได้คะแนน: handler เขียน Redis แล้ว emit `leaderboard:update` เข้า `host:{pin}` (ข้อมูลหลักสิบรายการ ปริมาณต่ำ ไม่ต้อง throttle ฝั่ง server) ฝั่ง Host UI ให้รวมการอัปเดตภาพไม่เกิน ~1 ครั้งต่อ 300 ms
- หลัง submit ที่ผ่านด่านสุดท้าย: มาร์ก `finished`, `INCR game:{pin}:finished` เพื่อได้ `finishRank` → ถ้า `finishRank` ≤ 5 ให้ `ZINCRBY` โบนัส `FINISH_BONUS[finishRank - 1]` เข้า `scores` **ก่อน** ส่ง `leaderboard:update` และก่อนจบเกม (เพื่อให้อันดับสุดท้ายรวมโบนัสครบ) → แล้วถ้า `finishRank == min(5, playerCount)` ให้จบเกม — การสลับสถานะ `PLAYING → FINISHED` ต้อง **atomic** (compare-and-set เช่น Lua script หรือ `HSETNX`) เพื่อไม่ให้ `game:ended` ถูกส่งซ้ำเมื่อหลายคนเข้าเส้นชัยพร้อมกัน
- ทุก `player:submit` ต้องเช็กสถานะเกมก่อน ถ้าไม่ใช่ `PLAYING` ให้ตอบ `GAME_ENDED` และไม่บันทึกคะแนน (กรณี submit ที่ค้างอยู่ระหว่างเกมจบถือว่าไม่นับ)
- `game:ended` ที่ส่งให้ Player มีแค่ `{ myScore }` ของคนนั้น (ไม่แนบอันดับหรือคะแนนคนอื่น) ส่วน Host ได้ `finalRanking` เต็ม
- Event ใหม่ใช้รูปแบบ `scope:action` และต้องอัปเดตตารางนี้ + `src/shared/events.ts`

---

## 7. ระบบคะแนน

**หลักการสำคัญ: server คือผู้ตัดสินคะแนนเสมอ** ห้ามเชื่อคะแนนที่ client ส่งมา

- Client ส่งแค่ "คำตอบ/ผลลัพธ์ของด่าน" แล้ว server ตรวจและคำนวณเอง
- สูตรตั้งต้น (แก้ที่ `src/server/scoring.ts` ที่เดียว):

```
ผ่านด่าน (ตอบถูก)  → +10 คะแนน (POINTS_PER_CHALLENGE = 10)
ตอบผิด             → +0 คะแนน (ไม่หัก ไม่มี wrong penalty) ลองใหม่ได้
ไม่มี time bonus   → คะแนนต่อด่านไม่ขึ้นกับเวลาที่ใช้
```

- ความเร็วมีผลต่ออันดับ **ทางอ้อมเท่านั้น** คือใครเข้าเส้นชัยก่อนได้โบนัส และเกมหยุดเมื่อ 5 คนแรกเสร็จ (ไม่มีการจับเวลาต่อด่านและไม่ต้องเก็บ `challengeStartedAt`)
- เพราะไม่มี penalty ผู้เล่นจึงสุ่มเดาคำตอบได้ไม่จำกัด → **ฝั่ง server ต้องกันการเดาแบบ brute force**: ใช้ cooldown ต่อการ submit (หัวข้อ "กันกดรัว" ด้านล่าง) และออกแบบคำตอบของแต่ละด่านไม่ให้เดาได้ง่าย (ไม่ใช่ตัวเลือกให้เลือก 2–3 ข้อ) ดูเพิ่มในข้อ 10
- **โบนัสเข้าเส้นชัย**: ผู้เล่นที่ผ่านครบทุกด่านเป็น 5 คนแรกได้โบนัสตามลำดับ ที่ 1 = +5, ที่ 2 = +4, ที่ 3 = +3, ที่ 4 = +2, ที่ 5 = +1 (คนที่ 6 เป็นต้นไปไม่มีเพราะเกมจบไปแล้ว) กำหนดเป็นค่าคงที่เดียว:

```ts
export const STAGE_COUNT = 5;
export const POINTS_PER_CHALLENGE = 10;
export const FINISH_LIMIT = 5;
export const FINISH_BONUS = [5, 4, 3, 2, 1] as const; // index = finishRank - 1
```

- เนื่องจากเกมหยุดเมื่อ 5 คนแรกเสร็จ **ความเร็วในการผ่านด่านมีผลต่ออันดับโดยตรง** ผู้เล่นที่ช้าอาจเล่นไม่ครบด่านก่อนเกมจบ — อันดับตัดสินด้วยคะแนนรวม (รวมโบนัส) ณ ตอนเกมจบ
- สเกลที่ตกลงแล้ว: 5 ด่าน × 10 คะแนน = 50 คะแนนจากด่าน + โบนัสเข้าเส้นชัย 1–5 คะแนน ดังนั้นโบนัสมีน้ำหนักจริงต่อผลแพ้ชนะ (คนที่ 1 ได้เปรียบคนที่ 2 อยู่ 1 คะแนน และเปรียบคนที่ 5 อยู่ 4 คะแนน) อย่าปรับตัวเลขเองโดยพลการ
- ผ่านแต่ละด่านได้คะแนนครั้งเดียว
- Tie-break: คะแนนมากกว่าชนะ → ถ้าเท่ากันดูว่าใครถึงคะแนนนั้นก่อน (ดู `game:{pin}:lastScoredAt`) — คะแนนเป็นจำนวนเต็มก้อนละ 10 จึงมีโอกาสเสมอกันสูง ต้องมี tie-break เสมอ

### กันกดรัว (anti-spam) — ตอบผิดได้ไม่จำกัด แต่ต้องไม่รัว

```ts
export const SUBMIT_COOLDOWN_MS = 1500;
```

ฝั่ง **server** (บังคับจริง):
- ทุก `player:submit` เริ่มด้วย `SET game:{pin}:cd:{playerId} 1 NX PX 1500` ถ้าตั้งไม่สำเร็จ (ยังอยู่ใน cooldown) → ตอบ `{ error: 'TOO_FAST', retryAfterMs }` **โดยไม่ตรวจคำตอบ และไม่ถือว่าเป็นการตอบผิด**
- key นี้มี TTL สั้นมาก หมดอายุเอง ไม่ต้องลงทะเบียนใน `game:{pin}:keys`
- เสริมด้วย rate limit ภาพรวมด้วย `@upstash/ratelimit` (เช่น ไม่เกิน 20 submit ต่อนาทีต่อผู้เล่น) กันคนข้าม cooldown ด้วยการยิงหลาย connection
- การ submit ซ้ำของคำตอบที่ถูกอยู่แล้วต้อง idempotent (ตรวจด้วย `SADD done:{playerId}` ตามข้อ 5) ห้ามให้คะแนนซ้ำ

ฝั่ง **client** (เพื่อ UX ไม่ใช่การป้องกันจริง):
- ปุ่มส่งคำตอบ `disabled` ตั้งแต่กดจนได้ ack กลับ (ห้ามมี request ซ้อน)
- หลังได้ผล "ผิด" ให้ปุ่ม disabled ต่ออีก `SUBMIT_COOLDOWN_MS` พร้อมนับถอยหลังให้เห็น ("รอ 1.5 วิ…")
- ถ้าได้ `TOO_FAST` ให้แสดงข้อความสั้นๆ แล้วรอตาม `retryAfterMs` ไม่ retry อัตโนมัติ
- กฎนี้ใช้กับปุ่ม "ส่ง/ถัดไป" ของทุกด่าน ไม่ต้องจำกัดการโต้ตอบอื่นภายในด่าน (เช่น การกดปิดป๊อปอัป) เว้นแต่ด่านนั้นออกแบบไว้เอง

---

## 8. Authentication (Host คนเดียว)

ขอบเขตเล็กโดยตั้งใจ: **ไม่มีระบบสมัครสมาชิก ไม่มี OAuth ไม่มีตาราง user**

- รหัสผ่านอยู่ใน env: `HOST_PASSWORD` (ยาวและสุ่ม)
- `POST /api/host/login` (Route Handler ปกติ): เทียบรหัสแบบ constant-time → ออก session cookie เป็น **JWT ด้วย `jose`** เซ็นด้วย `AUTH_SECRET`
  - `httpOnly`, `secure` (production), `sameSite=lax`, อายุเช่น 7 วัน
- `middleware.ts`: ป้องกันทุก route ใต้ `/host/*` ยกเว้น `/host/login`
- **Socket.IO**: ใน `io.use(...)` ตอน handshake ให้อ่าน cookie แล้ว verify JWT ถ้า valid → `socket.data.isHost = true` **ทุก handler `host:*` ต้องเช็ค flag นี้** (ห้ามเชื่อ payload ที่อ้างว่าเป็น Host) — cookie ส่งมากับ handshake ได้เพราะ socket อยู่โดเมนเดียวกับเว็บ
- จำกัดจำนวนครั้ง login ผิดต่อ IP ด้วย `@upstash/ratelimit`
- Player ไม่ผ่านระบบนี้ ใช้ `playerId` + `playerToken` (สุ่ม) ซึ่ง server ตรวจกับ Redis ทุกครั้งที่ `player:rejoin` และ `player:submit`

ตัวแปร env:

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_REDIS_TCP_URL=      # rediss://... สำหรับ Socket.IO Redis adapter (ioredis)
HOST_PASSWORD=
AUTH_SECRET=                # สุ่มอย่างน้อย 32 ตัวอักษร
```

ตั้งค่าใน Vercel Project Settings → Environment Variables (ห้าม commit ค่าจริง) และเปิด **Fluid compute** ให้โปรเจกต์

---

## 9. ดีไซน์ด่านแบบ User Inyerface

หัวใจของเกมคือ **UI ที่ตั้งใจแกล้งผู้เล่น แต่ต้อง "แฟร์" คือมีทางผ่านเสมอ**

ตัวอย่างกลไก:
- ปุ่ม "Next/No" ที่ตำแหน่งสลับกันไปมา, ปุ่ม Accept ปลอมตัวใหญ่ ปุ่มจริงตัวเล็กสีจาง
- ฟอร์มรหัสผ่านที่มีกฎขัดแย้งกันเอง (ต้องมีชื่อเมืองหลวง, ตัวเลขโรมัน, ฯลฯ)
- Dropdown ที่ตัวเลือกเรียงสลับ/ย้อนกลับ, ช่องวันเกิดลำดับ เดือน/วัน/ปี สลับ
- Captcha ล้อเลียน, checkbox ที่ต้อง "ไม่ติ๊ก" ถึงจะถือว่าติ๊ก
- Popup/Cookie banner/แชทบอทปลอมที่บังหน้าจอ ต้องปิดให้ถูกอัน
- ตัวนับเวลาหลอก, ข้อความแจ้งเตือนผิดๆ

กฎการออกแบบด่าน:
1. **ทุกด่านต้องผ่านได้เสมอ** และมีคำตอบที่ server ตรวจแบบ deterministic
2. แต่ละด่านเป็น component อิสระใน `src/challenges/<id>/` + ลงทะเบียน metadata (`id`, `title`, `order`) ใน `src/shared/challenges.ts` — มี **5 ด่านเท่านั้น** และทุกด่านมีค่าเท่ากันที่ `POINTS_PER_CHALLENGE` (ไม่มี `basePoints`/`timeLimitMs` รายด่าน)
3. ตรรกะตรวจคำตอบอยู่ที่ `src/server/validators/<id>.ts`; client มีแค่ UI
4. ความสุ่ม (เช่น ตำแหน่งปุ่ม) ใช้ **seed** จาก server เพื่อให้ผู้เล่นทุกคนได้ความยากเท่ากัน และเพราะ server ไม่มี state ในหน่วยความจำ validator ต้องคำนวณคำตอบที่ถูกจาก seed + `challengeId` ได้ทุกครั้ง
5. ความหงุดหงิดต้องมาจาก UX ไม่ใช่บั๊ก ห้ามทำให้ด่านค้างจริง
6. แกล้งในเชิงขำขันเท่านั้น ห้ามเก็บข้อมูลส่วนตัวจริง หรือหลอกให้กรอกรหัสผ่าน/บัตรจริง ในด่านใช้ข้อมูลสมมติ
7. คอมโพเนนต์ของด่านเป็น Client Component (`"use client"`) และต้อง **ไม่ทำให้ hydration mismatch** (ค่าสุ่มมาจาก seed ไม่ใช่ `Math.random()` ตอน render)
8. **ทุกด่านต้องเล่นได้บนมือถือ/จอสัมผัส** (ไม่พึ่ง hover, ปุ่มกดได้ขนาดพอ) และใช้คีย์บอร์ดได้ ผู้เล่นส่วนใหญ่น่าจะเล่นบนมือถือ

### รายการ 5 ด่าน (เรียงตามลำดับที่ผู้เล่นเจอ ความยากไล่ระดับโดยประมาณ)

| # | `id` | ชื่อด่าน | กลไกแกล้ง | ผู้เล่นส่งอะไร | server ตรวจอย่างไร |
|---|------|----------|-----------|----------------|--------------------|
| 1 | `popup-maze` | **ปิดป๊อปอัปให้หมด** | คุกกี้แบนเนอร์, แชทบอทปลอมเด้งทักทาย, โฆษณา, ปุ่ม ✕ ปลอมที่เปิดป๊อปอัปใหม่, ปุ่มปิดจริงตัวเล็กสีจาง | ลำดับ action id ที่กด (สูงสุด ~60 รายการ) | server **จำลอง state machine ของป๊อปอัป** จาก seed แล้วรันลำดับ action ถ้าจบที่สถานะ "ปิดครบ" = ถูก (ปุ่มกับดักแค่เปิดป๊อปอัปเพิ่ม ไม่ทำให้ติดตาย) |
| 2 | `reverse-signup` | **สมัครสมาชิกแบบกลับด้าน** | ช่องเรียงสลับ, วันเกิดเป็น ปี→วัน→เดือน และ dropdown เรียงย้อนกลับ, อีเมลแยกเป็น 3 ช่อง, checkbox "ฉันไม่ยอมรับเงื่อนไข" ที่ต้องติ๊ก/ไม่ติ๊กกลับด้าน | ข้อมูลทุกช่องเป็น object | หน้าจอแสดง "ข้อมูลผู้สมัครตัวอย่าง" (ชื่อ, วันเกิด, อีเมลสมมติ) ที่ **สร้างจาก seed** ผู้เล่นต้องกรอกให้ตรง server เทียบกับ persona ที่สร้างจาก seed + ค่า checkbox ที่คาดไว้ |
| 3 | `reverse-captcha` | **พิสูจน์ว่าคุณเป็นมนุษย์** | captcha ล้อเลียน 3 รอบ ตาราง 3×3 คำสั่งกลับด้าน เช่น "เลือกทุกช่องที่ *ไม่ใช่* ผลไม้" และมีกรอบแดงที่ต้องข้าม | ชุดช่องที่เลือกของทั้ง 3 รอบ | server คำนวณชุดคำตอบจาก seed แล้วเทียบ ต้องถูกทั้ง 3 รอบ (3 รอบทำให้เดาไม่ได้: 512³ แบบ) ใช้ไอคอน/อีโมจิ/SVG ที่เราวาดเอง ห้ามใช้รูปมีลิขสิทธิ์ |
| 4 | `password-rules` | **ตั้งรหัสผ่านที่ไม่มีวันถูกใจ** | กฎโผล่ทีละข้อ ขัดแย้งหรือเกินจริง เช่น ต้องมีตัวเลขโรมันที่รวมได้ค่าที่กำหนด, ต้องมีชื่อเมืองหลวงจากรายการที่ seed เลือก, ต้องมีคำที่แสดงเป็นภาพ | สตริงรหัสผ่าน (ความยาวไม่เกิน 100) | validator เป็น pure function ตรวจสตริงกับชุดกฎที่สร้างจาก seed **ทุก seed ต้องมีคำตอบอ้างอิง** (เขียนเทสต์ที่สร้างคำตอบจาก rule set แล้วรัน validator ยืนยัน) |
| 5 | `final-boss` | **ด่านสุดท้าย: ฉันไม่ใช่หุ่นยนต์** | ปุ่มส่งที่หนีเมาส์/สลับตำแหน่ง (หยุดหนีหลังหนีครบ 3 ครั้ง และใช้คีย์บอร์ดกดได้), รหัส 8 ตัวที่ต้องพิมพ์จากขวาไปซ้าย, slider ที่ตัวเลขบนแถบสลับกับค่าจริง, checkbox 3 ช่องที่เงื่อนไขขัดกัน | `{ code, sliderValue, checks }` | server เทียบกับค่าที่คำนวณจาก seed |

กฎเพิ่มเติม:
- id ด่านด้านบนคือค่าจริงใน `src/shared/challenges.ts` (`order` = ลำดับ 1–5)
- ทุก validator เป็น pure function: `validate(seed, challengeId, answer) → boolean` เทสต์ได้โดยไม่ต้องใช้ Redis
- ก่อนลงมือสร้างแต่ละด่าน ให้ทำให้ด่านที่แล้วผ่านเทสต์ (รวมกรณี seed หลายค่า) และ flow เกมทั้งระบบทำงานครบก่อน
- ถ้าผู้ใช้อยากเปลี่ยน/สลับด่าน ให้แก้ตารางนี้ก่อน แล้วค่อยแก้โค้ด

---

## 10. ความปลอดภัยและกัน cheat

- ตรวจ input ทุก event ฝั่ง server (ชื่อ 1–20 ตัวอักษร, PIN เป็นตัวเลข 6 หลัก, `challengeId` มีอยู่จริง) แนะนำใช้ `zod`
- ห้ามใช้ `dangerouslySetInnerHTML` กับชื่อผู้เล่น
- Rate limit `player:join` และ `player:submit` ต่อ IP/`playerId` ผ่าน Upstash — **`player:submit` สำคัญเป็นพิเศษ** เพราะตอบผิดไม่โดนหักคะแนน จึงต้องกันการสุ่มเดาคำตอบรัวๆ ด้วย cooldown 1.5 วินาที + rate limit ตามข้อ 7
- ไม่ส่งเฉลย/คำตอบที่ถูกไปให้ client ล่วงหน้า และไม่ส่งคะแนนคนอื่นให้ Player
- ผู้เล่นรีเฟรชหรือ connection หลุดแล้วกลับเข้าเกมได้ด้วย `player:rejoin` คะแนนไม่หายเพราะอยู่ใน Redis
- Request ของผู้เล่นจากเกมที่ถูกลบแล้วต้องได้ error ชัดเจน (`GAME_NOT_FOUND`) แล้ว client พากลับหน้า Join
- ห้าม commit `.env.local`; ห้าม log ค่า secret

---

## 11. คำสั่งที่ใช้บ่อย

```bash
npm install
npm run dev              # next dev (หรือ `vercel dev` เพื่อทดสอบ api/socket-io.ts ให้ใกล้ของจริง)
npm run build
npm run test             # Vitest
npm run test:e2e         # Playwright จำลองหลายผู้เล่น
npm run lint && npm run typecheck
```

Deploy: ผูก repo กับ Vercel (หรือ `vercel --prod`) แล้วตั้ง env ตามข้อ 8 และเปิด Fluid compute **ทดสอบบน Preview deployment ด้วยผู้เล่นหลายคนเสมอ** เพราะพฤติกรรมหลาย instance จะไม่เกิดตอนรัน local

---

## 12. แนวทางเขียนโค้ด

- TypeScript `strict` ห้ามใช้ `any` นอกจากมีเหตุผลและคอมเมนต์กำกับ
- ฟังก์ชันคะแนนและ state machine เป็น pure function ที่เทสต์ง่าย แยกจากการเรียก Redis/Socket
- Server Component เป็นค่าเริ่มต้น ใส่ `"use client"` เฉพาะที่ต้องใช้ state/event handler/socket
- socket client สร้างครั้งเดียว (singleton) ตั้ง reconnection ให้ทำงาน และเมื่อ `connect` สำเร็จทุกครั้งให้เรียก `player:rejoin` / `host:watch` เพื่อกู้สถานะ
- ข้อความ UI ภาษาไทยแยกไว้ในไฟล์ string กลาง
- Commit message: `type: สรุปสั้นๆ` เช่น `feat: add leaderboard update to host room`

---

## 13. สิ่งที่ agent ควรทำ / ไม่ควรทำ

**ควรทำ**
- เริ่มจาก MVP: host login → สร้างเกม → player เข้าห้อง → เริ่มเกม → ด่านจริงจนครบ 5 ด่าน → leaderboard realtime บนหน้า Host (เริ่มจากทำ 1–2 ด่านให้ flow ทั้งระบบทำงานก่อน แล้วค่อยเพิ่มจนครบ 5)
- **ทดสอบให้เร็วที่สุดว่า Socket.IO + Redis adapter ทำงานบน Vercel Preview** (ผู้เล่นหลาย connection ต่อกันข้าม instance ได้) ก่อนสร้างฟีเจอร์อื่น
- เขียนเทสต์ให้ logic คะแนน, `resetGame()` (ต้องลบครบจริง), limit 50 คน, เงื่อนไขจบเกม และ validator ของแต่ละด่าน
- ถ้าความต้องการไม่ชัดและตัดสินใจย้อนกลับยาก ให้ถามผู้ใช้สั้นๆ ก่อน

**ไม่ควรทำ**
- ไม่เก็บคะแนนหรือตัดสินผลฝั่ง client
- ไม่เก็บ state ในหน่วยความจำของ server, ไม่ใช้ timer ฝั่ง server
- ไม่ลืม Redis adapter และไม่ใช้ long-polling transport
- ไม่แสดงคะแนน/อันดับของคนอื่นให้ Player
- ไม่ใช้บริการ realtime ภายนอก (Pusher/Ably) หรือ server แยกนอก Vercel เว้นแต่ผู้ใช้สั่ง
- ไม่ใช้ CSS framework อื่นนอกจาก CSS Modules
- ไม่เพิ่มระบบ user/สมัครสมาชิก/ฐานข้อมูลถาวร/ประวัติเกม เว้นแต่ผู้ใช้ขอ
- ไม่ใช้ `KEYS *` / `FLUSHALL` กับ Upstash

---

## 14. Roadmap

1. **Spike**: `api/socket-io.ts` + Redis adapter + ทดสอบบน Vercel Preview ว่า broadcast ข้าม instance ได้
2. **MVP**: host login + สร้างเกม/PIN + lobby (limit 50) + ด่านแรก 1–2 ด่านเพื่อพิสูจน์ flow + leaderboard realtime บนหน้า Host + `resetGame()`
3. rejoin/reconnect, เงื่อนไขจบเกม (5 คนแรก finished) + Host กดจบเอง, หน้าสรุปอันดับบนหน้า Host
4. ทำให้ครบ **5 ด่าน** (จำนวนด่านตายตัว) และปรับความยากให้ไล่ระดับ
5. เสียง/แอนิเมชัน, projector mode สำหรับหน้า Host

---

## 15. คำถามที่ยังเปิดอยู่

- ไม่มีคำถามค้างอยู่ ณ ตอนนี้ รายการ 5 ด่านอยู่ในข้อ 9 และ cooldown กันกดรัวอยู่ในข้อ 7 หากผู้ใช้ต้องการเปลี่ยนให้แก้สองข้อนั้นก่อน
