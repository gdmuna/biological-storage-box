<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="px-4 py-4">
                <!-- 昵称 -->
                <v-text-field v-model="nickname" label="昵称" :rules="[rules.notNull]" outlined dense></v-text-field>
                <!-- 真实姓名 -->
                <v-text-field v-model="realName" label="真实姓名" :rules="[rules.notNull]" outlined dense></v-text-field>
                <!-- UID -->
                <v-text-field v-model="uid" label="UID" readonly outlined dense></v-text-field>
                <!-- 密码 -->
                <v-text-field v-model="password" label="密码" type="password" outlined dense @click="showPasswordDialog"></v-text-field>
                <!-- 保存按钮 -->
                <v-btn class="mt-4 bg-custom-green text-white" block @click="saveSettings">保存</v-btn>
            </v-card>
        </div>
        <!-- 修改密码对话框 -->
        <v-dialog v-model="passwordDialog" max-width="500px" @click:outside="clearPasswordFields">
            <v-card>
                <!-- 对话框标题 -->
                <v-card-title>修改密码</v-card-title>
                <!-- 对话框内容 -->
                <v-card-text class="pb-2">
                    <v-text-field v-model="oldPasswordInput" label="旧密码" :type="showOldPassword ? 'text' : 'password'" :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'" :rules="[rules.notNull]" outlined dense @click:append-inner="showOldPassword = !showOldPassword"></v-text-field>
                    <v-text-field v-model="newPassword" label="新密码" :type="showNewPassword ? 'text' : 'password'" :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'" :rules="[rules.notNull, rules.minLength]" outlined dense @click:append-inner="showNewPassword = !showNewPassword"></v-text-field>
                    <v-text-field v-model="confirmPassword" label="确认新密码" :type="showConfirmPassword ? 'text' : 'password'" :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'" :rules="[rules.notNull, rules.minLength, rules.matchPassword]" outlined dense @click:append-inner="showConfirmPassword = !showConfirmPassword"></v-text-field>
                </v-card-text>
                <!-- 对话框操作按钮 -->
                <v-card-actions class="justify-center pb-2">
                    <v-btn class="mt-2 teal-lighten-1-bg text-white" style="width: 80%" @click="updatePassword">修改</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 保存失败提示 -->
        <v-alert v-model="showErrorAlert" type="error" dismissible class="rounded-lg p-2 mx-auto w-3/4 sm:w-2/3 md:w-1/2 lg:w-1/3">原密码输入错误，请重新输入</v-alert>
        <!-- 保存成功提示 -->
        <v-alert v-model="showSuccessAlert" type="success" dismissible class="rounded-lg p-2 mx-auto w-3/4 sm:w-2/3 md:w-1/2 lg:w-1/3">密码更新成功！请重新登录</v-alert>
    </div>
</template>

<script>
export default {
    name: 'SettingPage',
    components: {},
    data() {
        return {
            uid: '',
            nickname: '',
            realName: '',
            // 控制修改密码弹窗+成功提示的显示与隐藏
            passwordDialog: false,
            showSuccessAlert: false,
            showErrorAlert: false,
            // 用户输入的内容（原密码+新密码+第二次新密码）
            oldPasswordInput: '',
            newPassword: '',
            confirmPassword: '',
            // 控制密码输入框的显示与隐藏
            showOldPassword: false,
            showNewPassword: false,
            showConfirmPassword: false,
            rules: {
                notNull: (value) => !!value || '此处不能为空',
                minLength: (value) => (value && value.length >= 6) || '密码长度至少为6位',
                matchPassword: (value) => value === this.newPassword || '两次输入的密码不匹配'
            }
        };
    },
    created() {
        this.loadUserInfo();
    },
    mounted() {},
    updated() {},
    methods: {
        // 加载用户信息
        async loadUserInfo() {
            const response = await this.$api.user.userInfo();
            if (response) {
                const userInfo = response;
                this.uid = userInfo.uid;
                this.nickname = userInfo.nickName;
                this.realName = userInfo.realName;
            }
        },
        // 显示修改密码对话框
        async showPasswordDialog() {
            this.passwordDialog = true;
        },
        // 清空密码输入字段
        clearPasswordFields() {
            this.oldPasswordInput = '';
            this.newPassword = '';
            this.confirmPassword = '';
            this.showOldPassword = false;
            this.showNewPassword = false;
            this.showConfirmPassword = false;
        },
        // 更新密码
        async updatePassword() {
            // 调用后端接口更新密码
            const result = await this.$api.user.updatePassword({ oldPassword: this.oldPasswordInput, newPassword: this.newPassword });
            // 旧密码错误进行提示并直接结束后续操作
            if (!result) {
                this.showErrorAlert = true;
                this.passwordDialog = false;
                setTimeout(() => {
                    this.showErrorAlert = false;
                }, 3000);
                return;
            }
            // 修改成功后重新登录
            this.showSuccessAlert = true;
            this.passwordDialog = false;
            setTimeout(() => {
                this.showSuccessAlert = false;
                this.$router.push('/auth/login');
            }, 3000);
        },
        // 保存昵称 真实姓名修改
        async saveSettings() {
            await this.$api.user.updateInfo({ nickname: this.nickname, realname: this.realName });
        }
    }
};
</script>

<style scoped>
.teal-lighten-1-bg {
    background-color: #95b9a1; /* teal-lighten-1 颜色的背景色 */
    border-radius: 8px; /* 适当的圆角半径 */
    padding: 12px; /* 适当的内边距 */
    margin: 0; /* 移除默认的 margin */
}
.bg-custom-green {
    background-color: #95b9a1;
}
</style>
