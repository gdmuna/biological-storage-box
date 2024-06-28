<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10">
            <v-text-field class="" :loading="loading" append-inner-icon="mdi-magnify" label="搜索" variant="solo" hide-details single-line @click:append-inner="onClick"></v-text-field>
        </div>
    </div>
</template>

<script>
export default {
    name: 'SearchPage',
    components: {},
    data() {
        return {
            loaded: false,
            loading: false
        };
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {
        onClick() {
            this.loading = true;

            setTimeout(() => {
                this.loading = false;
                this.loaded = true;
            }, 2000);
        }
    }
};
</script>

<style scoped></style>
