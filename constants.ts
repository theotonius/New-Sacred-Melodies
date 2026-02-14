
import { Song, SavedStudy } from './types';

export const BIBLE_SONGS: Song[] = [
  {
    id: '1',
    title: 'Amazing Grace',
    reference: 'Psalm 103:8',
    category: 'Hymn',
    image: 'https://images.unsplash.com/photo-1519810755548-39cd217da494?auto=format&fit=crop&q=80&w=800',
    lyrics: [
      "Amazing grace! How sweet the sound",
      "That saved a wretch like me!",
      "I once was lost, but now am found;",
      "Was blind, but now I see.",
      "",
      "'Twas grace that taught my heart to fear,",
      "And grace my fears relieved;",
      "How precious did that grace appear",
      "The hour I first believed.",
      "",
      "Through many dangers, toils and snares,",
      "I have already come;",
      "'Tis grace hath brought me safe thus far,",
      "And grace will lead me home."
    ]
  },
  {
    id: '2',
    title: 'Jesus Loves Me',
    reference: 'Matthew 19:14',
    category: 'Kids',
    image: 'https://images.unsplash.com/photo-1484662020986-75935d2ebc66?auto=format&fit=crop&q=80&w=800',
    lyrics: [
      "Jesus loves me! This I know,",
      "For the Bible tells me so;",
      "Little ones to Him belong;",
      "They are weak, but He is strong.",
      "",
      "Yes, Jesus loves me!",
      "Yes, Jesus loves me!",
      "Yes, Jesus loves me!",
      "The Bible tells me so.",
      "",
      "Jesus loves me! He who died",
      "Heaven's gate to open wide;",
      "He will wash away my sin,",
      "Let His little child come in."
    ]
  },
  {
    id: '3',
    title: 'How Great Thou Art',
    reference: 'Psalm 145:3',
    category: 'Worship',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    lyrics: [
      "O Lord my God, when I in awesome wonder",
      "Consider all the worlds Thy hands have made,",
      "I see the stars, I hear the rolling thunder,",
      "Thy power throughout the universe displayed.",
      "",
      "Then sings my soul, my Savior God, to Thee,",
      "How great Thou art, how great Thou art!",
      "Then sings my soul, my Savior God, to Thee,",
      "How great Thou art, how great Thou art!"
    ]
  },
  {
    id: '4',
    title: 'Great Is Thy Faithfulness',
    reference: 'Lamentations 3:22-23',
    category: 'Hymn',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800',
    lyrics: [
      "Great is Thy faithfulness, O God my Father,",
      "There is no shadow of turning with Thee;",
      "Thou changest not, Thy compassions, they fail not",
      "As Thou hast been Thou forever wilt be.",
      "",
      "Great is Thy faithfulness! Great is Thy faithfulness!",
      "Morning by morning new mercies I see;",
      "All I have needed Thy hand hath provided—",
      "Great is Thy faithfulness, Lord, unto me!"
    ]
  }
];

export const PRE_CACHED_STUDIES: SavedStudy[] = [
  {
    id: 'pre-1',
    reference: 'যোহন ৩:১৬',
    content: "১. পদ: \"কারণ ঈশ্বর জগতকে এমন প্রেম করিলেন যে, আপনার একজাত পুত্রকে দান করিলেন, যেন যে কেহ তাঁহাতে বিশ্বাস করে, সে বিনষ্ট না হয়, কিন্তু অনন্ত জীবন পায়।\"\n\n২. প্রেক্ষাপট: যীশু এবং নিকদীমের কথোপকথনের অংশ এটি। ঈশ্বর যে কেবল যিহূদীদের নয়, সারা জগতকে ভালোবাসেন তা এখানে স্পষ্ট।\n\n৩. গভীর অর্থ: ঈশ্বরের ভালোবাসা নিঃস্বার্থ এবং সীমাহীন। তিনি আমাদের উদ্ধারের জন্য সবচেয়ে বড় ত্যাগ স্বীকার করেছেন।\n\n৪. জীবনের প্রয়োগ: আমরা যখনই একাকীত্ব বা পাপবোধে ভুগি, তখন আমাদের মনে রাখা উচিত যে ঈশ্বর আমাদের জন্য পথ খুলে রেখেছেন। বিশ্বাসই মুক্তির একমাত্র চাবিকাঠি।",
    timestamp: Date.now()
  },
  {
    id: 'pre-2',
    reference: 'গীতসংহিতা ২৩:১',
    content: "১. পদ: \"সদাপ্রভু আমার পালক; আমার অভাব হইবে না।\"\n\n২. প্রেক্ষাপট: রাজা দায়ূদের লেখা একটি প্রার্থনা। একজন মেষপালক যেভাবে তার মেষদের রক্ষা করেন, ঈশ্বরও আমাদের সেভাবে পরিচালনা করেন।\n\n৩. গভীর অর্থ: ঈশ্বর আমাদের কেবল প্রয়োজনীয়তাই মেটান না, তিনি আমাদের বিপদে শান্তি ও আশ্বাস দেন।\n\n৪. জীবনের প্রয়োগ: জীবনের কঠিন সময়ে বা দুশ্চিন্তার মুহূর্তে এই পদটি আমাদের ভরসা দেয় যে ঈশ্বর আমাদের পাশে আছেন।",
    timestamp: Date.now()
  }
];
