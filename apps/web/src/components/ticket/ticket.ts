export interface Ticket {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  description: string[];
  ageLimit: string;
  language: string;
  thumbnailUrl: string;
  duration: string;
  price?: {
    currency: string;
    amount: number;
  };
}

export const ticketData: Ticket = {
  id: "kunal-kamra-dubai",
  title: "Kunal Kamra - Live in Dubai",
  subtitle: "A Stand-up Comedy Show",
  date: "26 Jan 2026",
  time: "8:00 PM",
  duration: "90 mins",
  venue: "EMIRATES THEATRE",
  location: "EMIRATES INTERNATIONAL SCHOOL, DUBAI",
  description: [
    "Kunal Kamra is getting his brand new comedy special to Dubai!",
    "Kunal is known for his new thoughts and offbeat comedy style. Everytime he comes on stage, he leaves the crowd in splits with his incredible timing. His observational jokes from day-to-day life guarantees uncontrollable laughter. Don't miss this unforgettable evening of cutting-edge, out-loud commentary and unforgettable punchlines as Kunal Kamra addresses the quirks of today.",
  ],
  ageLimit: "16+",
  language: "English & Hindi",
  thumbnailUrl: "/kunal-ticket.png",
  price: {
    currency: "₹",
    amount: 7998,
  },
};
