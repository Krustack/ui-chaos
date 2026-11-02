export const STAGE_COUNT = 5;
export const POINTS_PER_CHALLENGE = 10;
export const FINISH_LIMIT = 5;
export const FINISH_BONUS = [5, 4, 3, 2, 1] as const;

export type ChallengeId =
  | 'popup-maze'
  | 'reverse-signup'
  | 'reverse-captcha'
  | 'password-rules'
  | 'final-boss';

export type ChallengeMeta = {
  id: ChallengeId;
  title: string;
  order: number;
};

export const challengeList: ChallengeMeta[] = [
  { id: 'popup-maze', title: 'ปิดป๊อปอัปให้หมด', order: 1 },
  { id: 'reverse-signup', title: 'สมัครสมาชิกแบบกลับด้าน', order: 2 },
  { id: 'reverse-captcha', title: 'พิสูจน์ว่าคุณเป็นมนุษย์', order: 3 },
  { id: 'password-rules', title: 'ตั้งรหัสผ่านที่ไม่มีวันถูกใจ', order: 4 },
  { id: 'final-boss', title: 'ฉันไม่ใช่หุ่นยนต์', order: 5 },
];

export const challengeMap = Object.fromEntries(challengeList.map((item) => [item.id, item])) as Record<
  ChallengeId,
  ChallengeMeta
>;
