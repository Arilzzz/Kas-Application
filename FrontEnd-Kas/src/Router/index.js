import { createRouter, createWebHistory } from 'vue-router'
import LoginStudent from '../Views/loginStudent.vue'
import DashboardStd from '../Views/DashboardStd.vue'
import loginAdmin from '../Views/Admin/loginAdmin.vue'
import Dashboard from '../Views/Admin/Dashboard.vue'
import AddStudent from '../Views/Admin/AddStudent.vue'
import DataStudent from '../Views/Admin/DataStudent.vue'
import Payment from '../Views/Admin/Payment.vue'
import EditPayment from '../Views/Admin/EditPayment.vue'
import Expenditure from '../Views/Admin/Expenditure.vue'
import EditExpenditure from '../Views/Admin/EditExpenditure.vue'
import Register from '../Views/Admin/Register.vue'
import ForgotPassword from '../Views/Admin/ForgotPassword.vue'
import ResetPassword from '../Views/Admin/ResetPassword.vue'

const routes = [
    {   
        path: '/',
        redirect: '/login'  
    },
    {
        path: '/login',
        name: 'LoginStudent',   
        component: LoginStudent
    },
    {
        path: '/dashboardstd',
        name: 'DashboardStd',
        component: DashboardStd,
        meta: { requiresAuth: true, role: 'siswa' }
    },
    {
        path: '/admin/login',
        name: 'loginAdmin',
        component: loginAdmin
    },
    {
        path: '/admin/register',
        name: 'Register',
        component: Register
    },
    {
        path: '/admin/forgot-password',
        name: 'ForgotPassword',
        component: ForgotPassword
    },
    {
        path: '/admin/password-reset/:token',
        name: 'ResetPassword',
        component: ResetPassword
    },
    {
        path: '/admin/dashboard',
        name: 'AdminDashboard',
        component: Dashboard,
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/admin/addstudent',
        name: 'AddStudent',
        component: AddStudent,
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/admin/datastudent',
        name: 'DataStudent',
        component: DataStudent,
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/admin/payment',
        name: 'Payment',
        component: Payment,
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/admin/editpayment',
        name: 'EditPayment',
        component: EditPayment,
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/admin/expenditure',
        name: 'Expenditure',
        component: Expenditure,
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/admin/editexpenditure',
        name: 'EditExpenditure',
        component: EditExpenditure,
        meta: { requiresAuth: true, role: 'admin' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('auth_token')
    const role = localStorage.getItem('user_role')

    if (to.meta.requiresAuth && !token) {
        // Redirect to appropriate login based on route path
        if (to.path.startsWith('/admin')) {
            next('/admin/login')
        } else {
            next('/login')
        }
    } else if (to.meta.requiresAuth && token) {
        // Check role permission
        if (to.meta.role && to.meta.role !== role) {
            // Redirect based on current role
            if (role === 'admin') {
                next('/admin/dashboard')
            } else {
                next('/dashboardstd')
            }
        } else {
            next()
        }
    } else if (token && (to.path === '/login' || to.path === '/admin/login' || to.path === '/')) {
        // If already logged in and trying to access login pages, redirect to dashboard
        if (role === 'admin') {
            next('/admin/dashboard')
        } else {
            next('/dashboardstd')
        }
    } else {
        next()
    }
})

export default router