<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">用户画像</router-link>
    </div>
    <router-view />
  </div>
</template>

<style lang="scss">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;

    text-align: center;

    color: var(--primary-strong);

    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#nav {
    display: flex;

    height: 39px;
    padding: 10px 16px;

    align-items: center;
    justify-content: center;

    a {
        font-weight: bold;

        text-decoration: none;

        color: #2c3e50;

        &.router-link-exact-active {
            color: #42b983;
        }
    }
}

</style>
