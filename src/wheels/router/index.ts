export const routes = [
    {
        path: '/wheels',
        name: 'wheels',
        component: () => import("@/wheels/views/WheelsPage.vue"),
    },
    {
        path: '/wheels/:pathMatch(.*)*',
        name: 'wheels-not-found',
        redirect: '/wheels'
    }
]
