export const WHEEL_GALLERY_BANNER = "/assets/images/wheel-gallery-banner.webp";
export const E5_FORGED_GALLERY_BANNER = "/assets/images/e5-forged-gallery-banner.webp";
export const FORM_FORGED_SOLO_BLACK = "/assets/images/form-forged-solo-black.webp";
export const SPEEDWAY_LOGO = "/assets/images/speedway-logo.webp";
export const GALLERY_LOGO = "/assets/images/gallery-logo.webp";
export const FORM_FORGED_SERIES_LOGO = "/assets/images/form-forged-series-logo.webp";

export interface WheelGalleryItem {
    id: number;
    name: string;
    finish: string;
    series: string;
    image: string;
    detailedImage?: string;
    images?: string[];
    logo: string;
    link: string;
    featured?: boolean;
    finishes: string[];
    sizes: string[];
    madeFor: string[];
}

export const wheelGalleryItems: WheelGalleryItem[] = [
    {
        id: 1,
        name: "SPEEDWAY",
        finish: "TITANIUM BRUSHED TINT",
        series: "FORM FORGED SERIES",
        image: "/assets/images/speedway-dark-bronze.webp",
        detailedImage: "/assets/images/speedway-detailed-1.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/1",
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "DARK BRONZE"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    },
    {
        id: 2,
        name: "SPEEDWAY",
        finish: "GLOSS BLACK",
        series: "FORM FORGED SERIES",
        image: "/assets/images/speedway-gloss-black.webp",
        detailedImage: "/assets/images/speedway-detailed-2.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/2",
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "DARK BRONZE"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    },
    {
        id: 3,
        name: "SPEEDWAY",
        finish: "DARK BRONZE",
        series: "FORM FORGED SERIES",
        image: "/assets/images/speedway-titanium-brushed.webp",
        detailedImage: "/assets/images/speedway-detailed-1.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/3",
        featured: true,
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "DARK BRONZE"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    },
    {
        id: 4,
        name: "DAYTONA",
        finish: "TITANIUM BRUSHED TINT",
        series: "FORM FORGED SERIES",
        image: "/assets/images/daytona-bronze-brushed.webp",
        detailedImage: "/assets/images/daytona-detailed-1.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/4",
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "BRONZE BRUSHED TINT"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    },
    {
        id: 5,
        name: "DAYTONA",
        finish: "GLOSS BLACK",
        series: "FORM FORGED SERIES",
        image: "/assets/images/daytona-gloss-black.webp",
        detailedImage: "/assets/images/daytona-detailed-1.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/5",
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "BRONZE BRUSHED TINT"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    },
    {
        id: 6,
        name: "DAYTONA",
        finish: "BRONZE BRUSHED TINT",
        series: "FORM FORGED SERIES",
        image: "/assets/images/daytona-titanium-brushed.webp",
        detailedImage: "/assets/images/daytona-detailed-1.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/6",
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "BRONZE BRUSHED TINT"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    },
    {
        id: 7,
        name: "SEBRING",
        finish: "TITANIUM BRUSHED TINT",
        series: "FORM FORGED SERIES",
        image: "/assets/images/sebring-bronze-brushed.webp",
        detailedImage: "/assets/images/sebring-detailed-1.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/7",
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "BRONZE BRUSHED TINT"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    },
    {
        id: 8,
        name: "SEBRING",
        finish: "GLOSS BLACK",
        series: "FORM FORGED SERIES",
        image: "/assets/images/sebring-gloss-black.webp",
        detailedImage: "/assets/images/sebring-detailed-1.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/8",
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "BRONZE BRUSHED TINT"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    },
    {
        id: 9,
        name: "SEBRING",
        finish: "BRONZE BRUSHED TINT",
        series: "FORM FORGED SERIES",
        image: "/assets/images/sebring-titanium-brushed.webp",
        detailedImage: "/assets/images/sebring-detailed-1.webp",
        logo: "/assets/images/form-forged-solo-black.webp",
        link: "/gallery/wheels/detail/9",
        finishes: ["GLOSS BLACK", "TITANIUM BRUSHED TINT", "BRONZE BRUSHED TINT"],
        sizes: ['FRONTS - 19" x 9", 20" x 9"', 'REARS - 20" x 11", 21" x 12"'],
        madeFor: ["C6 (BASE, Z06, ZR1, GS)", "C7 (STINGRAY, Z06, ZR1, GS)", "C8 (STINGRAY)"]
    }
];
