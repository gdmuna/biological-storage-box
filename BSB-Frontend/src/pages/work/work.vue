<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="py-3" subtitle="应用功能">
                <div class="flex pb-3">
                    <div class="flex-1">
                        <div class="w-10 h-10 rounded-lg mx-auto">
                            <v-icon class="fa-solid fa-user-group w-10 h-10"></v-icon>
                        </div>
                        <div class="text-center text-xs pt-2">人员管理</div>
                    </div>
                    <div class="flex-1" @click="goToSearchPeople">
                        <div class="w-10 h-10 rounded-lg mx-auto">
                            <v-icon class="fa-solid fa-search w-10 h-10"></v-icon>
                        </div>
                        <div class="text-center text-xs pt-2">搜索人员</div>
                    </div>
                    <div class="flex-1">
                        <div class="w-10 h-10 rounded-lg mx-auto">
                            <v-icon class="fa-solid fa-hourglass-start w-10 h-10"></v-icon>
                        </div>
                        <div class="text-center text-xs pt-2">待拓展</div>
                    </div>
                </div>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'WorkPage',
    components: {},
    data() {
        return {};
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {
        goToSearchPeople() {
            this.$router.push('/work/searchPeople');
        }
    }
};
</script>

<style scoped></style>
