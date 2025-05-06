<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="px-4 py-4">
                <!-- 邮箱 -->
                <v-text-field v-model="email" label="邮箱" type="Email" outlined dense @click="showEmailDialog"></v-text-field>
                <!--昵称-->
                <v-text-field v-model="nickName" label="昵称" :rules="[rules.notNull]" outlined dense @click="showNickNameDialog"></v-text-field>
                <!-- 真实姓名 -->
                <v-text-field v-model="realName" label="真实姓名" :rules="[rules.notNull]" outlined dense @click="showRealNameDialog"></v-text-field>
                <!-- UID -->
                <v-text-field v-model="uid" label="UID" readonly outlined dense></v-text-field>
                <!-- 密码 -->
                <v-text-field v-model="password" label="密码" type="password" outlined dense @click="showPasswordDialog"></v-text-field>
                
                <!-- 保存按钮 -->
                <v-btn :loading="isSaving" :disabled="isSaving" class="mt-4 bg-custom-green text-white" block @click="saveSettings">保存</v-btn>
            </v-card>
        </div>

        <!-- 修改昵称对话框 -->
        <v-dialog v-model="nickNameDialog" max-width="500px" @click:outside="clearNickNameField">
            <v-card>
                <v-card-title>修改昵称</v-card-title>
                <v-card-text class="pb-2">
                    <v-text-field v-model="newNickName" label="新昵称" :rules="[rules.notNull]" outlined dense></v-text-field>
                </v-card-text>
                <v-card-actions class="justify-center pb-2">
                    <v-btn :loading="isUpdatingNickName" :disabled="!newNickName" class="mt-2 teal-lighten-1-bg text-white" style="width: 80%" @click="updateNickName">修改昵称</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 修改真实姓名对话框 -->
        <v-dialog v-model="realNameDialog" max-width="500px" @click:outside="clearRealNameField">
            <v-card>
                <v-card-title>修改真实姓名</v-card-title>
                <v-card-text class="pb-2">
                    <v-text-field v-model="newRealName" label="新真实姓名" :rules="[rules.notNull]" outlined dense></v-text-field>
                </v-card-text>
                <v-card-actions class="justify-center pb-2">
                    <v-btn :loading="isUpdatingRealName" :disabled="!newRealName" class="mt-2 teal-lighten-1-bg text-white" style="width: 80%" @click="updateRealName">修改真实姓名</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        
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
                <!-- 修改密码操作按钮 -->
                <v-card-actions class="justify-center pb-2">
                    <v-btn :loading="isUpdatingPassword" :disabled="!isPasswordFieldsFilled || isUpdatingPassword" class="mt-2 teal-lighten-1-bg text-white" style="width: 80%" @click="updatePassword">修改密码</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 修改邮箱对话框 -->
        <v-dialog v-model="emailDialog" max-width="500px" @click:outside="clearEmailFields">
            <v-card>
                <v-card-title>修改邮箱</v-card-title>
                <v-card-text class="pb-2">
                    <v-text-field v-model="email" label="当前邮箱" type="email" readonly outlined dense></v-text-field>

                    <v-text-field v-model="code" label="输入你的验证码" :append-inner-icon="'mdi-shield-key'" :rules="[rules.notNull]" outlined dense>
                        <template #append>
                            <v-btn text small :disabled="!email || sending || countdown > 0" @click="sendCode">
                                {{ countdown > 0 ? countdown + '秒后重发' : sending ? '发送中...' : '发送验证码' }}
                            </v-btn>
                        </template>
                    </v-text-field>

                    <v-text-field v-model="newEmail" label="新邮箱" type="email" :rules="[rules.notNull, rules.email]" outlined dense></v-text-field>

                    <v-text-field v-model="confirmEmail" label="确认新邮箱" type="email" :rules="[rules.notNull, rules.email, rules.matchEmail]" outlined dense></v-text-field>
                </v-card-text>

                <v-card-actions class="justify-center pb-2">
                    <v-btn :loading="isUpdatingEmail" :disabled="!canUpdateEmail" class="mt-2 teal-lighten-1-bg text-white" style="width: 80%" @click="updateEmail">修改邮箱</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
export default {
    name: 'SettingPage',
    components: {},
    data() {
        return {
            uid: '',
            account: '',
            nickName: '',
            realName: '',
            email: '3108006259@qq.com',
            // 控制修改密码弹窗+修改个人信息弹窗+成功提示的显示与隐藏
            passwordDialog: false,
            // 用户输入的内容（原密码+新密码+第二次新密码）
            oldPasswordInput: '',
            newPassword: '',
            confirmPassword: '',
            // 控制密码输入框的显示与隐藏
            showOldPassword: false,
            showNewPassword: false,
            showConfirmPassword: false,
            // 控制“保存按钮”是否可点击
            isSaving: false,
            // 控制“修改密码按钮”是否可点击
            isUpdatingPassword: false,
            // 控制修改密码弹窗+修改个人信息弹窗+成功提示的显示与隐藏
            emailDialog: false,
            // 用户输入的内容（原密码+新密码+第二次新密码）
            oldEmailInput: '',
            code: '',
            newEmail: '',
            confirmEmail: '',
            // 控制密码输入框的显示与隐藏
            showOldEmail: false,
            showNewEmail: false,
            showConfirmEmail: false,
            // 控制“修改密码按钮”是否可点击
            isUpdatingEmail: false,
            countdown: 0,
            sending: false,
            // 修改昵称弹窗
            nickNameDialog: false,
            newNickName: '',
            isUpdatingNickName: false,
            // 修改真实姓名弹窗
            realNameDialog: false,
            newRealName: '',
            isUpdatingRealName: false,

            rules: {
                notNull: (value) => !!value || '此处不能为空',
                minLength: (value) => (value && value.length >= 6) || '密码长度至少为6位',
                matchPassword: (value) => value === this.newPassword || '两次输入的密码不匹配',
                email: (value) => /^(?:[a-z0-9]+(?:[.-_][a-z0-9]+)*@[a-z0-9-]+\.[a-z0-9]+(?:\.[a-z0-9]+)*)$/i.test(value) || '邮箱格式不正确',
                matchEmail: (value) => value === this.newEmail || '两次输入的邮箱不匹配'
            }
        };
    },
    computed: {
        // 检查所有密码输入框是否都有内容
        isPasswordFieldsFilled() {
            return this.oldPasswordInput && this.newPassword && this.confirmPassword && this.newPassword === this.confirmPassword && this.newPassword.length >= 6;
        },
        // 检查所有邮箱输入框是否都有内容
        isEmailFieldsFilled() {
            return this.oldEmailInput && this.newEmail && this.confirmEmail && this.newEmail === this.confirmEmail;
        },
        canUpdateEmail() {
            return (
                this.verifyCode &&
                this.newEmail &&
                this.confirmEmail &&
                this.newEmail === this.confirmEmail &&
                this.newEmail !== this.email
            );
        }
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
                this.nickName = userInfo.nickName;
                this.account = userInfo.account;
                this.realName = userInfo.realName;
            }
        },
        // 显示修改密码对话框
        async showPasswordDialog() {
            this.passwordDialog = true;
        },
        // 显示修改邮箱对话框
        async showEmailDialog() {
            this.emailDialog = true;
        },
        // 显示修改昵称对话框
        showNickNameDialog() {
            this.nickNameDialog = true;
            this.newNickName = this.nickName;
        },
        // 显示修改真实姓名对话框
        showRealNameDialog() {
            this.realNameDialog = true;
            this.newRealName = this.realName;
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
        // 清空邮箱输入字段
        clearEmailFields() {
            this.oldEmailInput = '';
            this.newEmail = '';
            this.confirmEmail = '';
            this.showOldEmail = false;
            this.showNewEmail = false;
            this.showConfirmEmail = false;
        },
        // 清空昵称输入字段
        clearNickNameField() {
            this.newNickName = '';
        },
        // 清空真实姓名输入字段
        clearRealNameField() {
            this.newRealName = '';
        },
        // 修改密码
        async updatePassword() {
            // 禁用“修改密码”按钮
            this.isUpdatingPassword = true;
            // 调用后端接口更新密码
            const result = await this.$api.user.updatePassword({ oldPassword: this.oldPasswordInput, newPassword: this.newPassword });
            // 旧密码错误进行提示并直接结束后续操作
            if (!result) {
                // 显示“原密码输入错误，请重新输入”消息条
                this.$api.notify.error('原密码输入错误，请重新输入');
                // 重新启用“修改密码”按钮
                this.isUpdatingPassword = false;
                return;
            }
            // 修改成功后重新登录
            // 显示“密码修改成功，请重新登录”消息条
            this.$api.notify.success('密码修改成功！请重新登录');
            this.passwordDialog = false;
            this.$router.push('/auth/login');
        },
        // 保存用户名 真实姓名修改
        async saveSettings() {
            result = await this.$api.user.updateInfo({ account: this.account, realName: this.realName });
            console.log(result);
            if (result === '操作成功') {
                // 上传成功后返回上一页
                this.$router.go(-1);
                this.$api.notify.success('更改成功');
            } else {
                this.loading = false;
                this.$api.notify.error('更改失败，请重试');
            }
        },
        // 点击发送验证码按钮
        async sendCode() {
            // 防止重复点击
            if (this.sending || this.countdown > 0) return;
            this.sending = true;
            try {
                await this.$api.user.sendEmail({ email: this.email });
                this.$api.notify.success('验证码已发送');
                // 成功后启动60秒倒计时
                this.startCountdown(60);
            } catch (error) {
                this.$api.notify.error('发送验证码失败，请稍后重试');
            } finally {
                this.sending = false;
            }
        },
        // 启动倒计时
        startCountdown(seconds) {
            this.countdown = seconds;
            this.timer && clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.countdown--;
                if (this.countdown <= 0) {
                    clearInterval(this.timer);
                    this.timer = null;
                }
            }, 1000);
        },
        async updateEmail() {
            this.isUpdatingEmail = true;
            try {
                const result = await this.$api.user.updateEmail({
                    code: this.verifyCode,
                    newEmail: this.newEmail
                });
                if (result === '操作成功') {
                    this.$api.notify.success('邮箱修改成功');
                    this.emailDialog = false;
                    this.email = this.newEmail;
                } else {
                    this.$api.notify.error(result || '修改失败，请重试');
                }
            } catch (e) {
                this.$api.notify.error('修改失败，请检查验证码');
            }
            this.isUpdatingEmail = false;
        },
        // 修改昵称
        async updateNickName() {
            this.isUpdatingNickName = true;
            try {
                const result = await this.$api.user.updateInfo({
                    nickName: this.newNickName,
                    realName: this.realName
                });
                console.log(result);
                if (result === '修改完成') {
                    this.$api.notify.success('昵称修改成功');
                    this.nickName = this.newNickName;
                    this.nickNameDialog = false;
                } else {
                    this.$api.notify.error('修改失败，请重试');
                }
            } catch (error) {
                this.$api.notify.error('修改失败，请重试');
            }
            this.isUpdatingNickName = false;
        },
        // 修改真实姓名
        async updateRealName() {
            this.isUpdatingRealName = true;
            try {
                const result = await this.$api.user.updateInfo({
                    nickName: this.nickName,
                    realName: this.newRealName
                });
                if (result === '修改完成') {
                    this.$api.notify.success('真实姓名修改成功');
                    this.realName = this.newRealName;
                    this.realNameDialog = false;
                } else {
                    this.$api.notify.error('修改失败，请重试');
                }
            } catch (error) {
                this.$api.notify.error('修改失败，请重试');
            }
            this.isUpdatingRealName = false;
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
