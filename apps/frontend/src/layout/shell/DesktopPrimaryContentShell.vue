<template>
    <div class="flex flex-col min-h-0 min-w-0">
        <div class="flex h-15 items-center justify-between gap-5 overflow-hidden border-b px-4 py-2 shrink-0">
            <div class="shrink-0 font-medium">
                <span>工作台 / 总览</span>
            </div>
            <div class="flex min-w-0">
                <div class="relative w-96 mr-4 shrink-2">
                    <Search
                        aria-hidden="true"
                        stroke-width="1.5"
                        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input class="pl-9 pr-21 cursor-pointer" placeholder="搜索工作区或执行命令" />
                    <kbd
                        class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                    >
                        Ctrl + K
                    </kbd>
                </div>
                <div class="flex *:size-9">
                    <Button variant="ghost" size="sm" class="p-1" title="通知">
                        <span class="sr-only">通知</span>
                        <Bell aria-hidden="true" class="size-5" stroke-width="1.5" />
                    </Button>
                    <Button variant="ghost" size="sm" class="p-1" title="帮助">
                        <span class="sr-only">帮助</span>
                        <CircleQuestionMark aria-hidden="true" class="size-5" stroke-width="1.5" />
                    </Button>
                    <Button variant="ghost" size="sm" class="p-1" title="设置">
                        <span class="sr-only">设置</span>
                        <Settings aria-hidden="true" class="size-5" stroke-width="1.5" />
                    </Button>
                </div>
                <Popover>
                    <PopoverAnchor class="min-w-0">
                        <PopoverTrigger as-child>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="flex h-full w-full min-w-0 max-w-48 items-center justify-between gap-2.5"
                            >
                                <div class="rounded-full size-6 bg-primary/10 shrink-0"></div>
                                <span class="truncate">Maiturin</span>
                            </Button>
                        </PopoverTrigger>
                    </PopoverAnchor>
                    <PopoverContent class="p-0 w-auto" align="end">
                        <ButtonGroup orientation="vertical">
                            <Button class="font-normal" variant="outline">
                                <div class="flex items-center w-full h-full gap-1">
                                    <UserRound />
                                    <span>账号设置</span>
                                </div>
                            </Button>
                            <Button
                                class="hover:bg-destructive/20 font-normal"
                                variant="outline"
                                @click="$router.push('/auth/login')"
                            >
                                <div class="flex items-center w-full h-full gap-1">
                                    <LogOut />
                                    <span>退出登录</span>
                                </div>
                            </Button>
                        </ButtonGroup>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        <RouterTabProvider>
            <slot />
        </RouterTabProvider>
    </div>
</template>

<script setup lang="ts">
import { RouterTabProvider } from '@/modules';

import { Button } from '@/ui/button';
import { ButtonGroup } from '@/ui/button-group';
import { Input } from '@/ui/input';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/ui/popover';

import { Search, Bell, CircleQuestionMark, Settings, LogOut, UserRound } from '@lucide/vue';
</script>

<style scoped></style>
