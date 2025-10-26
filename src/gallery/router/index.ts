export const routes = [
    {
        path: '/gallery/:pathMatch(.*)*',
        name: 'not-found',
        redirect: '/gallery'
    },
    {
        path: '/gallery',
        name: 'gallery',
        component: () => import("@/views/VetteGallery.vue"),
    }
]