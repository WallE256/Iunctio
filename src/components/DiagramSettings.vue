<template>
    <div>
        <component
            v-for="setting in settings"
            :key="setting.id"
            :is="setting.component"
            :settingid="setting.id"
            :settinglabel="setting.name"
            v-bind="setting.properties"
            @setting-changed="onSettingChanged"
        />
    </div>
</template>

<script lang="ts">
// create as follows:
// <diagram-settings diagramid="id-here" />

import { defineComponent } from "vue";
import * as GlobalStorage from "@/scripts/globalstorage";
import CheckboxSetting from "@/components/settings/CheckboxSetting.vue";
import NumberSetting from "@/components/settings/NumberSetting.vue";
import SelectSetting from "@/components/settings/SelectSetting.vue";
import TextSetting from "@/components/settings/TextSetting.vue";
import { Setting, getVisibleSettings } from "@/scripts/settingconfig";

export default defineComponent({
    components: {
        CheckboxSetting,
        NumberSetting,
        SelectSetting,
        TextSetting,
    },

    props: {
        diagramid: {
            type: String,
            required: true,
        },
    },

    data() {
        return {
            settings: [] as Setting[],
        };
    },

    async mounted() {
        const diagram = await GlobalStorage.getDiagram(this.diagramid);
        if (!diagram) {
            console.warn("Non-existent diagram:", this.diagramid);
            return;
        }
        const graph = await GlobalStorage.getDataset(diagram.graphID);
        if (!graph) {
            console.warn("Non-existent data set:", diagram.graphID);
            return;
        }

        this.settings = getVisibleSettings(diagram, graph);
    },

    methods: {
        onSettingChanged(id: string, value: any) {
            this.$emit("setting-changed", id, value);
        },
    },
});
</script>
