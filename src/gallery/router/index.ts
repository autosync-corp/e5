export const routes = [
    {
        path: '/gallery',
        name: 'gallery',
        component: () => import("@/gallery/views/VetteGallery.vue"),
    },
    {
        path: '/gallery/detailed',
        name: 'gallery-detailed',
        component: () => import("@/gallery/views/VetteDetailedGallery.vue"),
    },
    {
        path: '/gallery/detail/:id',
        name: 'gallery-detail',
        component: () => import("@/gallery/views/VetteGalleryDetail.vue"),
    },
    {
        path: '/gallery/:pathMatch(.*)*',
        name: 'not-found',
        redirect: '/gallery'
    }
]