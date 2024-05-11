<template>
    <v-navigation-drawer v-model="_drawer" temporary>
        <v-list>
            <v-list-item title="我的课题组"></v-list-item>
        </v-list>
    </v-navigation-drawer>
</template>

<script lang="js">
export default {
    name: 'OrgDrawer',
    components: {},
    props: {
        value: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:value'],
    data() {
        return {};
    },
    computed: {
        _drawer: {
            get() {
                return this.value;
            },
            set(val) {
                this.$emit('update:value', val);
            }
        }
    },
    created() {},
    mounted() {},
    updated() {},
    unmounted() {},
    methods: {}
};
</script>

<style scoped></style>
