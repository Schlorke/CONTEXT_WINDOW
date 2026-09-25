# Pipeline de personagem rigged

Ordem fixa. Parar cedo se o pedido for só análise.

1. Cena: objetos, collections, modo atual.
2. Mesh que deforma: modifier ARMATURE e o objeto armature apontado.
3. Armature: lista de bones. Guardar os nomes.
4. Constraints de pose e drivers.
5. Vertex groups do mesh. Grupo sem bone, e bone sem grupo, são achado.
6. Não "consertar" peso no escuro. Amostrar os grupos do membro citado.
7. Actions no objeto e no armature. NLA strips mute ou não.
8. Checkpoint (`save_as`) antes de Weight Paint, extrude de bone ou key.

Não apagar: weights, constraints, modifiers, Actions, shape keys.

Deformação numa asa: achar a cadeia cujo nome ou posição corresponde à asa. Não
rotacionar o rig inteiro. Uma pose de diagnóstico volta a zero antes de
encerrar, se o usuário não pediu para manter a pose.
