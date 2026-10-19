export type DrawMode = 'list' | 'number';

export interface HistoryItem {
  id: string;
  timestamp: Date;
  mode: DrawMode;
  results: string[];
  poolSize: number;
}

export interface PresetItem {
  id: string;
  name: string;
  icon: string;
  items: string[];
}

export const PRESETS: PresetItem[] = [
  {
    id: 'food',
    name: '오늘의 메뉴',
    icon: '🍔',
    items: ['짜장면', '김치찌개', '돈까스', '삼겹살', '초밥', '칼국수', '햄버거', '샌드위치', '치킨', '떡볶이', '마라탕', '된장찌개'],
  },
  {
    id: 'penalty',
    name: '벌칙 정하기',
    icon: '🎯',
    items: ['노래 한 곡 완창하기', '엉덩이로 이름 쓰기', '음료수 / 커피 쏘기', '오늘 설거지 담당', '애교 3종 세트', '딱밤 한 대 맞기'],
  },
  {
    id: 'yesno',
    name: 'Yes or No',
    icon: '✨',
    items: ['YES (무조건 GO!)', 'NO (이번엔 패스)', '한 번 더 돌려보기', '신중하게 내일 결정'],
  },
  {
    id: 'weekend',
    name: '주말 활동',
    icon: '🏖️',
    items: ['최신 영화 보러가기', '하루종일 푹 쉬기', '핫플 카페 투어', '가벼운 산책과 운동', '밀린 OTT 몰아보기', '책 읽고 사색하기'],
  },
  {
    id: 'duty',
    name: '역할 / 당번',
    icon: '🧹',
    items: ['1조: 메인 정리', '2조: 분리수거', '3조: 설거지/정리', '4조: 환기 및 바닥청소'],
  },
];
