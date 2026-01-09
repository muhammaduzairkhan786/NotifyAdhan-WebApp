export const PRAYER_DATA = {
    Fajr: {
        virtues: [
            {
                text: "The two Rak'ah before the dawn (Fajr) prayer are better than this world and all it contains.",
                source: "Sahih Muslim 725a"
            },
            {
                text: "Whoever prays the Fajr prayer, he is under the protection of Allah.",
                source: "Sahih Muslim 657"
            }
        ],
        recommendations: [
            {
                title: "Sunnah Recitation",
                text: "Recite Surah Al-Kafirun in the first Rak'ah and Surah Al-Ikhlas in the second Rak'ah of the Fajr Sunnah.",
                source: "Sahih Muslim 726"
            },
            {
                title: "After Prayer Dua",
                arabic: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ",
                text: "O Allah, protect me from the Fire. (Recite 7 times)",
                source: "Sunan Abi Dawud 5079"
            }
        ]
    },
    Dhuhr: {
        virtues: [
            {
                text: "This is an hour at which the gates of heaven are opened, and I like that my good deeds should rise to heaven at that time.",
                source: "Jami` at-Tirmidhi 478"
            },
            {
                text: "Whoever observes four Rak'ah before Dhuhr and four after it, Allah will shield him against the Fire.",
                source: "Sunan Abu Dawood 1269"
            }
        ],
        recommendations: [
            {
                title: "Before Dhuhr",
                text: "Perform four Rak'ah before the obligatory Dhuhr prayer. The Prophet (PBUH) rarely missed them.",
                source: "Sahih Bukhari 1182"
            }
        ]
    },
    Asr: {
        virtues: [
            {
                text: "He who observes the two cool prayers (Fajr and Asr) will enter Paradise.",
                source: "Sahih Bukhari 574"
            },
            {
                text: "Angels take turns around you by night and day, and they all assemble at the Fajr and Asr prayers.",
                source: "Sahih Bukhari 555"
            }
        ],
        recommendations: [
            {
                title: "Pre-Asr Sunnah",
                text: "May Allah have mercy on the person who prays four Rak'ahs before Asr.",
                source: "Sunan Abi Dawud 1271"
            }
        ]
    },
    Maghrib: {
        virtues: [
            {
                text: "My Ummah will continue to be on the Fitrah as long as they do not delay Maghrib until the stars appear.",
                source: "Sunan Abu Dawood 418"
            }
        ],
        recommendations: [
            {
                title: "Sunnah Surahs",
                text: "Recite Surah Al-Kafirun and Surah Al-Ikhlas in the two Rak'ahs after Maghrib.",
                source: "Sunan an-Nasa'i 908"
            },
            {
                title: "Protection Dua",
                arabic: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ",
                text: "O Allah, protect me from the Fire. (Recite 7 times after Maghrib)",
                source: "Sunan Abi Dawud 5079"
            }
        ]
    },
    Isha: {
        virtues: [
            {
                text: "Whoever prays Isha in congregation, it is as if he spent half the night in prayer.",
                source: "Sahih Muslim 656a"
            }
        ],
        recommendations: [
            {
                title: "Before Sleep",
                text: "Recite Surah Al-Mulk before sleeping to be protected from the punishment of the grave.",
                source: "Sunan al-Tirmidhi 2892"
            },
            {
                title: "Ayatul Kursi",
                text: "Recite Ayatul Kursi after every obligatory prayer; nothing stands between you and Paradise but death.",
                source: "Sunan an-Nasa'i al-Kubra 9848"
            }
        ]
    }
};

// Map for backward compatibility
export const PRAYER_VIRTUES = Object.fromEntries(
    Object.entries(PRAYER_DATA).map(([key, value]) => [key, value.virtues])
);
