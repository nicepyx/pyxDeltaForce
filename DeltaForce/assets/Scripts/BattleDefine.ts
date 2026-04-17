const { ccclass, property } = cc._decorator;

/**
 * 升级类型枚举。
 *
 * 用于标记一条升级选项到底会触发什么效果，
 * 方便 UI、战斗管理器和具体数值逻辑之间传递同一份标识。
 */
export enum UpgradeType {
    /** 给小队新增一名干员。 */
    AddMember = 1,
    /** 提高全队攻击力。 */
    AddAtk,
    /** 提高全队射速。 */
    AddFireRate
}

/**
 * 单个升级选项的数据结构。
 *
 * `BattleManager` 负责生成它，
 * `LevelUpPanel` 负责展示它，
 * 选择完成后再回到 `BattleManager` 应用效果。
 */
export interface UpgradeOption {
    /** 升级类型标识。 */
    type: UpgradeType,
    /** 升级标题，用于按钮主标题显示。 */
    title: string,
    /** 升级描述，用于解释本次升级的具体效果。 */
    desc: string
}

/**
 * 战斗定义占位组件。
 *
 * 这个文件当前真正有价值的是上面的枚举和接口，
 * 类本身只是为了兼容 Cocos Creator 脚本组件结构而保留。
 * 目前没有承载实际运行时逻辑。
 */
@ccclass
export default class BattleDefine extends cc.Component {


    start() {
        // 预留生命周期入口，当前无实际逻辑。

    }

    // update (dt) {}
}
