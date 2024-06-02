<template>
    <v-bottom-navigation v-model="navBarValue" color="light-green-lighten-1" grow horizontal>
        <v-btn @click="$router.push('/box')">
            <v-icon class="fa-duotone fa-vial"></v-icon>
        </v-btn>
        <v-btn @click="$router.push('/grid')">
            <v-icon class="fa-duotone fa-grid-2"></v-icon>
        </v-btn>
        <v-btn @click="$router.push('/user')">
            <v-icon class="fa-duotone fa-user"></v-icon>
        </v-btn>
    </v-bottom-navigation>
</template>

<script lang="js">
export default {
    name: 'NavBar',
    components: {},
    props: {},
    emits: [],
    data() {
        return {
            navBarValue: false
        };
    },
    created() {},
    mounted() {},
    updated() {},
    unmounted() {},
    methods: {}
};
</script>

<style scoped></style>
