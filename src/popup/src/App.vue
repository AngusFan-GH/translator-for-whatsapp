<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">用户画像</router-link>
    </div>
    <router-view class="view-container" />
  </div>
</template>

<style lang="scss">
html,
body {
    overflow: hidden;

    height: 100%;
    margin: 0;
    padding: 0;
}
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;

    display: flex;
    flex-direction: column;

    height: 100%;

    text-align: center;

    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#nav {
    display: flex;

    height: 39px;
    padding: 10px 16px;

    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    a {
        font-weight: bold;

        text-decoration: none;

        color: #2c3e50;

        &.router-link-exact-active {
            font-size: 16px;

            color: #42b983;
        }
    }
}
.view-container {
    flex: 1;
}

</style>
