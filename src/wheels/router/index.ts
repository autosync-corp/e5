export const routes = [
    {
        path: '/wheels',
        name: 'wheels',
        component: () => import("@/wheels/views/WheelsPage.vue"),
    },
    {
        path: '/wheels/gallery',
        name: 'wheels-gallery',
        component: () => import("@/wheels/views/WheelsGalleryPage.vue"),
    },
    {
        path: '/wheels/form-forged',
        name: 'wheels-form-forged',
        component: () => import("@/wheels/views/WheelsFormForgedPage.vue"),
    },
    {
        path: '/wheels/daytona',
        name: 'wheels-daytona',
        component: () => import("@/wheels/views/WheelsDaytonaPage.vue"),
    },
    {
        path: '/wheels/sebring',
        name: 'wheels-sebring',
        component: () => import("@/wheels/views/WheelsSebringPage.vue"),
    },
    {
        path: '/wheels/speedway',
        name: 'wheels-speedway',
        component: () => import("@/wheels/views/WheelsSpeedwayPage.vue"),
    },
    {
        path: '/wheels/talladega',
        name: 'wheels-talladega',
        component: () => import("@/wheels/views/WheelsTalladegaPage.vue"),
    },
    {
        path: '/wheels/:pathMatch(.*)*',
        name: 'wheels-not-found',
        redirect: '/wheels'
    }
]
