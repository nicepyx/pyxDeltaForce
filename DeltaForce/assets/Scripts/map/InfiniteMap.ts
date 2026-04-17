
const { ccclass, property } = cc._decorator;

/**
 * 无限地图平铺组件。
 *
 * 作用：
 * 1. 维护一组固定数量的地图块；
 * 2. 根据目标所在的地图格坐标，动态重排每个地图块的位置；
 * 3. 让地图视觉上看起来可以无限延展。
 *
 * 当前默认按 3x3 布局理解 `tileList`：
 * - 中间块围绕目标所在格子；
 * - 其余 8 块分布在四周；
 * - 当目标跨到新的格子时，旧地图块会被“搬运”到新位置。
 */
@ccclass
export default class InfiniteMap extends cc.Component {

    /** 地图跟随目标，通常是玩家或相机跟随对象。 */
    @property(cc.Node)
    public target: cc.Node = null;
    /** 参与循环平铺的地图块列表，默认按 3x3 顺序组织。 */
    @property(cc.Node)
    public tileList: cc.Node[] = [];


    /** 单个地图块的逻辑尺寸。 */
    tileSize: number = 1024;

    update(dt: number) {
        // 没有跟随目标时不更新地图块。
        if (!this.target) return;

        // 计算目标当前位于哪一个地图块坐标。
        const targetTileX = Math.floor(this.target.x / this.tileSize);
        const targetTileY = Math.floor(this.target.y / this.tileSize);

        for (let i = 0; i < this.tileList.length; i++) {
            const tile = this.tileList[i];

            // 把线性数组索引映射成 3x3 的局部偏移。
            const localIndexX = (i % 3) - 1;
            const localIndexY = Math.floor(i / 3) - 1;
            const worldTileX = targetTileX + localIndexX;
            const worldTileY = targetTileY + localIndexY;

            // 把每块地图放到它在世界中的目标格位置。
            tile.setPosition(
                worldTileX * this.tileSize,
                worldTileY * this.tileSize
            )
        }
    }
}
