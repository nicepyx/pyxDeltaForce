const { ccclass, property } = cc._decorator;

/**
 * 战斗结果面板。
 *
 * 作用：
 * 1. 在战斗结束时显示胜利或失败结果；
 * 2. 控制自身显示隐藏；
 * 3. 修改标题文本以反映当前结果类型。
 */
@ccclass
export default class ResultPanel extends cc.Component {


    /** 结果标题文本，例如“成功”或“失败”。 */
    @property(cc.Label)
    public titleLabel: cc.Label = null;

    onLoad() {
        // 初始化时默认隐藏结果面板，等待战斗结束后再显示。
        this.node.active = false;
    }

    public showFail() {
        // 显示失败结算。
        this.node.active = true;
        if (this.titleLabel) {
            this.titleLabel.string = "失败";
        }
    }
    public shoWin() {
        // 显示胜利结算。
        this.node.active = true;
        if (this.titleLabel) {
            this.titleLabel.string = "成功";
        }
    }

    public hide() {
        // 隐藏结果面板，通常用于重开或重新进入战斗前。
        this.node.active = false;
    }
}
