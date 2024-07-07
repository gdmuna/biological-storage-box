<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="mx-auto px-1 py-1" title="小刘" subtitle="XXXXXX学院XX级XX班">
                <template #prepend>
                    <v-avatar size="80">
                        <v-img alt="John" src="/images/avatar.jpg"></v-img>
                    </v-avatar>
                </template>
            </v-card>
            <v-card class="mt-5">
                <v-list-item prepend-icon="mdi-message" append-icon="mdi-chevron-right" lines="two" subtitle="消息" link></v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item prepend-icon="mdi-message-alert" append-icon="mdi-chevron-right" lines="two" subtitle="反馈意见" link></v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item prepend-icon="mdi-cog" append-icon="mdi-chevron-right" lines="two" subtitle="设置" link></v-list-item>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UserPage',
    components: {},
    data() {
        return {};
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {}
};
</script>

<style scoped></style>
