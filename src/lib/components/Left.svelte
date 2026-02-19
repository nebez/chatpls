<script lang="ts">
	import { resolve } from '$app/paths';
    import Logo from './Logo.svelte';
</script>

<div class="nav">
    <a href={resolve('/')} class="logo">
        <Logo />
    </a>
    <div class="section">
        <div class="section-header">Metadata</div>
        <div class="section-content"></div>
    </div>
</div>

<style>
    a.logo {
        line-height: 0;
        height: 100%;
        display: inline-block;
        margin: 10px;
        padding: 5px;
        border-radius: 3px;
    }

    a:hover {
        background-color: var(--bg-color);
    }
</style>
