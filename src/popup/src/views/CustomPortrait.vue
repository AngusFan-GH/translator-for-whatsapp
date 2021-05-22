<template>
  <div class="custom-portrait">
    <div
      class="user-info"
      v-loading="userLoading"
      element-loading-text="拼命加载中"
      element-loading-spinner="el-icon-loading"
      element-loading-background="rgba(0, 0, 0, 0)"
    >
      <template v-if="!userLoading">
        <div class="user-info-left">
          <div class="user-info-avatar">
            <svg
              v-show="!userInfo.avatar"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 212 212"
              width="212"
              height="212"
            >
              <path
                fill="#DFE5E7"
                class="background"
                d="M106.251.5C164.653.5 212 47.846 212 106.25S164.653 212 106.25 212C47.846 212 .5 164.654.5 106.25S47.846.5 106.251.5z"
              ></path>
              <path
                fill="#FFF"
                class="primary"
                d="M173.561 171.615a62.767 62.767 0 0 0-2.065-2.955 67.7 67.7 0 0 0-2.608-3.299 70.112 70.112 0 0 0-3.184-3.527 71.097 71.097 0 0 0-5.924-5.47 72.458 72.458 0 0 0-10.204-7.026 75.2 75.2 0 0 0-5.98-3.055c-.062-.028-.118-.059-.18-.087-9.792-4.44-22.106-7.529-37.416-7.529s-27.624 3.089-37.416 7.529c-.338.153-.653.318-.985.474a75.37 75.37 0 0 0-6.229 3.298 72.589 72.589 0 0 0-9.15 6.395 71.243 71.243 0 0 0-5.924 5.47 70.064 70.064 0 0 0-3.184 3.527 67.142 67.142 0 0 0-2.609 3.299 63.292 63.292 0 0 0-2.065 2.955 56.33 56.33 0 0 0-1.447 2.324c-.033.056-.073.119-.104.174a47.92 47.92 0 0 0-1.07 1.926c-.559 1.068-.818 1.678-.818 1.678v.398c18.285 17.927 43.322 28.985 70.945 28.985 27.678 0 52.761-11.103 71.055-29.095v-.289s-.619-1.45-1.992-3.778a58.346 58.346 0 0 0-1.446-2.322zM106.002 125.5c2.645 0 5.212-.253 7.68-.737a38.272 38.272 0 0 0 3.624-.896 37.124 37.124 0 0 0 5.12-1.958 36.307 36.307 0 0 0 6.15-3.67 35.923 35.923 0 0 0 9.489-10.48 36.558 36.558 0 0 0 2.422-4.84 37.051 37.051 0 0 0 1.716-5.25c.299-1.208.542-2.443.725-3.701.275-1.887.417-3.827.417-5.811s-.142-3.925-.417-5.811a38.734 38.734 0 0 0-1.215-5.494 36.68 36.68 0 0 0-3.648-8.298 35.923 35.923 0 0 0-9.489-10.48 36.347 36.347 0 0 0-6.15-3.67 37.124 37.124 0 0 0-5.12-1.958 37.67 37.67 0 0 0-3.624-.896 39.875 39.875 0 0 0-7.68-.737c-21.162 0-37.345 16.183-37.345 37.345 0 21.159 16.183 37.342 37.345 37.342z"
              ></path>
            </svg>
            <img v-show="userInfo.avatar" :src="userInfo.avatar" />
          </div>
        </div>
        <div class="user-info-right inhert-text">
          <div class="user-info-name">
            {{
              userInfo.verifiedName ||
              userInfo.pushname ||
              userInfo.name ||
              userInfo.formattedName
            }}
          </div>
          <div class="user-info-account">{{ userInfo.id }}</div>
        </div>
      </template>
    </div>
    <div
      class="form-info"
      v-loading="formLoading"
      element-loading-text="拼命加载中"
      element-loading-spinner="el-icon-loading"
      element-loading-background="rgba(0, 0, 0, 0)"
    >
      <template v-if="!formLoading">
        <template v-if="formData.length">
          <div class="form-info-item" v-for="item in formData" :key="item.id">
            <div class="form-info-item-label">{{ item.labelField }}</div>
            <div v-if="item.labelType === 'Input'">
              <el-input
                v-model="item.value"
                :placeholder="`请输入${item.labelField}`"
                clearable
              ></el-input>
            </div>
            <div v-if="item.labelType === 'Radio'">
              <el-radio
                v-for="radio in item.dictItemValue"
                v-model="item.value"
                :label="radio.key"
                :key="radio.key"
                >{{ radio.value }}</el-radio
              >
            </div>
            <div v-if="item.labelType === 'Checkbox'">
              <el-checkbox-group v-model="item.value">
                <el-checkbox
                  v-for="checkbox in item.dictItemValue"
                  :label="checkbox.key"
                  :key="checkbox.key"
                  >{{ checkbox.value }}</el-checkbox
                >
              </el-checkbox-group>
            </div>
            <div v-if="item.labelType === 'InputNumber'">
              <el-input-number v-model="item.value"></el-input-number>
            </div>
            <div v-if="item.labelType === 'TimePicker'">
              <el-time-picker
                v-model="item.value"
                value-format="timestamp"
                :placeholder="`请选择${item.labelField}`"
              >
              </el-time-picker>
            </div>
            <div v-if="item.labelType === 'DatePicker'">
              <el-date-picker
                v-model="item.value"
                type="date"
                value-format="timestamp"
                :placeholder="`请选择${item.labelField}`"
              >
              </el-date-picker>
            </div>
            <div v-if="item.labelType === 'DateTimePicker'">
              <el-date-picker
                v-model="item.value"
                type="datetime"
                value-format="timestamp"
                :placeholder="`请选择${item.labelField}`"
              >
              </el-date-picker>
            </div>
            <div v-if="item.labelType === 'Select'">
              <el-select
                v-model="item.value"
                :placeholder="`请选择${item.labelField}`"
                clearable
              >
                <el-option
                  v-for="select in item.dictItemValue"
                  :value="select.key"
                  :label="select.value"
                  :key="select.key"
                >
                </el-option>
              </el-select>
            </div>
            <div v-if="item.labelType === 'Textarea'">
              <el-input
                type="textarea"
                :rows="5"
                :placeholder="`请输入${item.labelField}`"
                v-model="item.value"
              >
              </el-input>
            </div>
            <div v-if="item.labelType === 'Rate'">
              <el-rate
                v-model="item.value"
                :max="+item.dictItemValue.total"
                allow-half
                show-score
                text-color="#ff9900"
                :score-template="item.dictItemValue.template"
              ></el-rate>
            </div>
          </div>
        </template>
        <div class="form-info-empty" v-else>未配置用户画像信息</div>
      </template>
    </div>
    <div class="btn-container">
      <el-button
        type="primary"
        v-show="formData.length"
        :disabled="formLoading"
        :loading="btnLoading"
        @click="dosubmit()"
        >提交</el-button
      >
    </div>
  </div>
</template>

<script>
import { MESSAGER_SENDER } from "../../../common/modal/index";

export default {
  name: "CustomPortrait",
  data() {
    return {
      userLoading: true,
      formLoading: true,
      btnLoading: false,
      userInfo: {},
      formData: [],
    };
  },
  created() {
    this.sendLoadedMessage();
    this.listenChangeCurrentFriend();
    this.listenGetCustomInfo();
    this.listenGetCustomPortraitFinish();
  },
  methods: {
    sendLoadedMessage() {
      this.$Messager.post(
        MESSAGER_SENDER.CONTENT,
        "customPortraitPageInit",
        true,
        undefined,
        window.top
      );
    },
    listenChangeCurrentFriend() {
      this.$Messager
        .receive(MESSAGER_SENDER.CONTENT, "currentFriendChange")
        .subscribe((e) => {
          this.userLoading = true;
          this.formLoading = true;
          console.log("currentFriendChange", e);
        });
    },
    listenGetCustomPortraitFinish() {
      this.$Messager
        .receive(MESSAGER_SENDER.CONTENT, "getCustomPortraitFinish")
        .subscribe((e) => {
          this.formData = (e.message || [])
            .sort(this.createComparisonFunction("serialNumber"))
            .map((item) => {
              const res = { ...item };
              if (res.dictItemValue) {
                if (res.labelType === "Rate") {
                  res.dictItemValue = Object.assign(
                    {},
                    ...JSON.parse(res.dictItemValue)
                  );
                  res.dictItemValue.template = res.dictItemValue.template
                    ? res.dictItemValue.template.replace("value", "{value}")
                    : "";
                } else {
                  res.dictItemValue = JSON.parse(res.dictItemValue).map(
                    (val) => ({
                      value: Object.keys(val)[0],
                      key: Object.values(val)[0],
                    })
                  );
                }
              }
              if (res.labelType === "Checkbox") {
                res.value = [];
              }
              res.value = res.labelContent
                ? JSON.parse(res.labelContent)
                : res.value;
              return res;
            });
          this.formLoading = false;
          console.log("getCustomPortraitFinish", this.formData);
        });
    },
    listenGetCustomInfo() {
      this.$Messager
        .receive(MESSAGER_SENDER.CONTENT, "getCustomInfo")
        .subscribe((e) => {
          this.userInfo = e.message;
          this.userLoading = false;
          console.log("getCustomInfo", e.message);
        });
    },
    createComparisonFunction(propertyName) {
      return (object1, object2) => {
        const value1 = object1[propertyName];
        const value2 = object2[propertyName];
        if (value1 < value2) {
          return -1;
        }
        if (value1 > value2) {
          return 1;
        }
        return 0;
      };
    },
    dosubmit() {
      this.btnLoading = true;
      const customPortrait = this.formData.map((item) => ({
        id: item.id,
        labelContent: JSON.stringify(item.value),
      }));
      console.log("addCustomPortrait", customPortrait, this.userInfo.id);
      this.$Messager
        .post(
          MESSAGER_SENDER.CONTENT,
          "addCustomPortrait",
          {
            customPortrait,
            customerAccount: this.userInfo.id,
          },
          undefined,
          window.top
        )
        .subscribe(
          (e) => {
            console.log("addCustomPortrait callback", e);
            const { code, message } = e || {};
            const type = code === 200 ? "success" : "error";
            this.$message({
              showClose: true,
              message,
              type,
            });
            this.btnLoading = false;
          },
          () => {
            this.$message({
              showClose: true,
              message: "出错了",
              type: "error",
            });
            this.btnLoading = false;
          }
        );
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@mixin zy-scrollbar-for-chrome {
    overflow: auto;
    &::-webkit-scrollbar {
        width: 5px;
        height: 1px;
    }
    &::-webkit-scrollbar-thumb {
        border-radius: 10px;
        background: #ccc;
        -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, .2);
                box-shadow: inset 0 0 5px rgba(0, 0, 0, .2);
    }
}
.custom-portrait {
    display: flex;
    overflow: hidden;
    flex-direction: column;
    &.dark {
        color: #f1f1f1;
    }
    .user-info {
        font-size: 16px;
        font-weight: 600;

        display: flex;

        box-sizing: border-box;
        height: 100px;
        padding: 20px;

        color: #606266;

        align-items: stretch;
        flex-shrink: 0;
        &-right {
            display: flex;
            flex-direction: column;
            flex: 1;

            box-sizing: border-box;
            padding: 0 10px 0 5px;

            justify-content: space-around;
            align-items: flex-start;
        }
        &-avatar {
            overflow: hidden;

            width: 60px;
            height: 60px;
            margin-right: 10px;

            border-radius: 100%;
            background: #ccc;
            img,
            svg {
                display: block;

                width: 100%;
                height: 100%;
            }
        }
    }
    .form-info {
        @include zy-scrollbar-for-chrome;

        overflow: auto;
        flex: 1;

        box-sizing: border-box;
        padding: 20px;
        &-item {
            text-align: left;
            &:not(:nth-child(1)) {
                margin-top: 15px;
            }
            &-label {
                font-size: 14px;
                font-weight: 600;

                margin-bottom: 8px;

                color: #42b983;
            }
        }
        &-empty {
            font-size: 16px;

            display: flex;

            height: 100%;

            color: #606266;

            align-items: center;
            justify-content: center;
        }
    }
    .btn-container {
        padding: 10px;
    }
}

</style>
