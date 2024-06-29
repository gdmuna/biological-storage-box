<template>
    <v-navigation-drawer v-model="_drawer" temporary>
        <v-list>
            <v-list-item title="我的课题组"></v-list-item>
        </v-list>
        <v-divider class="border-opacity-75"></v-divider>
        <v-list :items="items"></v-list>
        <v-divider class="border-opacity-75"></v-divider>
        <v-list>
            <v-list-group>
                <template #activator="{ props }">
                    <v-list-item v-bind="props" subtitle="创建或加入课题组/组织"></v-list-item>
                </template>
                <v-list>
                    <v-list-item append-icon="mdi-chevron-right" subtitle="创建课题组/组织" link></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" subtitle="加入课题组/组织" link></v-list-item>
                </v-list>
            </v-list-group>
            <v-list-item append-icon="mdi-chevron-right" lines="two" subtitle="退出已有课题组/组织" link></v-list-item>
        </v-list>
        <v-divider class="border-opacity-75"></v-divider>
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
        return {
            items: [
                {
                    title: 'Foo',
                    value: 'foo'
                },
                {
                    title: 'Bar',
                    value: 'bar'
                },
                {
                    title: 'Fizz',
                    value: 'fizz'
                },
                {
                    title: 'Buzz',
                    value: 'buzz'
                }
            ]
        };
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
