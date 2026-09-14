export interface Track { title:string; artist?:string; cover?:string; src:string }
export const playlist:Track[]=[
  {
    "title": "Agar Tum Saath Ho",
    "artist": "Alka Yagnik, Arijit Singh",
    "src": "/SONGS/Agar Tum Saath Ho Tamasha 320 Kbps.mp3",
    "cover": "/SONGS/artwork/Agar Tum Saath Ho Tamasha 320 Kbps.jpg"
  },
  {
    "title": "Baby Shark",
    "artist": "Pinkfong",
    "src": "/SONGS/Baby Shark \uff5c Animal Songs \uff5c PINKFONG Songs for Children.mp3",
    "cover": "/SONGS/artwork/Baby Shark \uff5c Animal Songs \uff5c PINKFONG Songs for Children.jpg"
  },
  {
    "title": "Masakali",
    "artist": "Mohit Chauhan",
    "src": "/SONGS/Masakali Delhi 6 320 Kbps.mp3",
    "cover": "/SONGS/artwork/Masakali Delhi 6 320 Kbps.jpg"
  },
  {
    "title": "Mast Magan",
    "artist": "Arijit Singh, Chinmayi Sripada",
    "src": "/SONGS/Mast Magan 2 States 320 Kbps.mp3",
    "cover": "/SONGS/artwork/Mast Magan 2 States 320 Kbps.jpg"
  },
  {
    "title": "Monta Re",
    "artist": "Swanand Kirkire, Amitabh Bhattacharya",
    "src": "/SONGS/Monta Re Lootera 320 Kbps.mp3",
    "cover": "/SONGS/artwork/Monta Re Lootera 320 Kbps.jpg"
  },
  {
    "title": "Santhippoma",
    "artist": "Unni Menon, Anupama, Chinmayee",
    "src": "/SONGS/Santhippoma.mp3",
    "cover": "/SONGS/artwork/Santhippoma.jpg"
  }
];
export const playlistCover:string|null=null;
export const finalInvite={title:"The Long Version",calendarUrl:"https://calendar.google.com/calendar/u/0/r?pli=1",date:null as string|null,startTime:null as string|null,endTime:null as string|null,location:null as string|null,description:"No agenda. No rushing. Just time."};
