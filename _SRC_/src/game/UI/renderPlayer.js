import { Sprite, Container, RenderTexture, Texture } from "pixi.js"
import { atlases } from "../../app/assets"
import { getAppRenderer } from "../../app/application"
import { AVATARS } from "../scenes/level/Player"
import { playerAvatarIndex, playerAvatarKeys } from "../state"

export function renderPlayer(index = null) {
    const container = new Container()
    const appRenderer = getAppRenderer()

    if (index) {
        const bg = new Sprite(atlases.ui.textures.popup)
        bg.scale.set(0.3)
        container.addChild( bg )
    } else {
        const bg = new Sprite(atlases.ui.textures.ui_skin_bg)
        bg.scale.set(0.9) //
        container.addChild( bg )
    }

    const playerContainer = new Container()
    playerContainer.scale.set(0.85)
    // playerContainer.position.set(index ? 116 : 136, index ? 86 : 118)
    playerContainer.position.set(index ? 116 : 122, index ? 86 : 106)
    const AVA_KEY = playerAvatarKeys[index ? index : playerAvatarIndex]
    const playerBody = new Sprite(atlases.player.textures[ AVA_KEY ])
    playerBody.anchor.set(0.5)
    playerContainer.addChild(playerBody)
    const playerEye = new Sprite(
        AVATARS[AVA_KEY].eye !== 'EMPTY'
        ? atlases.player.textures[ AVATARS[AVA_KEY].eye ]
        : Texture.EMPTY
    )
    playerEye.anchor.set(0.5)
    playerEye.position.set(32, -16)
    playerContainer.addChild(playerEye)
    const playerTongue = new Sprite(
        AVATARS[AVA_KEY].tongue !== 'EMPTY'
        ? atlases.player.textures[ AVATARS[AVA_KEY].tongue ]
        : Texture.EMPTY
    )
    playerTongue.pivot.set(47, 7)
    playerTongue.position.set(26, 26)
    playerContainer.addChild(playerTongue)
    container.addChild(playerContainer)

    const rt = RenderTexture.create({
        width: Math.ceil(container.width),
        height: Math.ceil(container.height),
        resolution: 1,
    })
  
    appRenderer.render({
        container: container,
        target: rt
    })

    playerContainer.destroy({children:true})
    container.destroy({children:true})
  
    return rt
}