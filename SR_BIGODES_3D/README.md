# Sr. Bigodes · personagem 3D (Blender)

Gato preto estilizado, construído com geometria real a partir da folha de referência: modelo, materiais, rig, expressões, animações básicas, câmeras e cena de estúdio.

- `SR_BIGODES.blend` — arquivo completo e editável (salvo no Blender 5.3).
- `scripts/` — o código que constrói tudo do zero e gera os renders.
- `renders/` — vistas, expressões, poses, malha e a folha de apresentação.

## O que tem no arquivo

| Coleção | Conteúdo |
|---|---|
| `CHARACTER/HEAD` | `SrBigodes_Cabeca`, sobrancelhas, nariz, boca |
| `CHARACTER/BODY` | `SrBigodes_Corpo` (tronco, pescoço, pernas, patas com dedos), coxins |
| `CHARACTER/EYES` | globos (íris, pupila, brilhos), pálpebras, órbitas |
| `CHARACTER/EARS` | orelhas com parte interna |
| `CHARACTER/WHISKERS` | 12 bigodes, um objeto de curva cada |
| `CHARACTER/TAIL` | cauda (8 ossos) |
| `CHARACTER/RIG` | `SrBigodes_Rig` |
| `CAMERAS` | 10 câmeras |
| `LIGHTING` | 5 luzes de área presas ao `LIGHT_Rig` |
| `ENVIRONMENT` | chão de estúdio |

Números da malha: 17 malhas, cerca de 50 mil vértices no total (cabeça 13,6 mil, corpo 30,7 mil), só quads na pele. 42 ossos, 43 shape keys, 17 ações.

Escala: 1 unidade = altura do gato sentado, com as orelhas. O gato olha para −Y; `.L` é a esquerda dele (+X).

## Como usar

**Expressões.** Selecione o rig, entre em Pose Mode e clique no osso `CTRL_face` (acima da cabeça). Em *Bone → Custom Properties* há um controle de 0 a 1 para cada expressão: `Curioso`, `Surpreso`, `Feliz`, `Bravo`, `Triste`, `Dormindo`, `Desconfiado` e `Piscar`. Tudo em zero é a expressão Normal. Cada controle move, por driver, as shape keys de pálpebras, pupilas, sobrancelhas e boca.

**Olhar.** Mova `CTRL_eyes` (na frente do rosto) para os lados ou para cima.

**Corpo.** `hips`, `spine`, `chest`, `neck`, `head`, `ear.L/R` e `tail_01…08` giram direto (FK). As pernas usam IK: `CTRL_front_paw.L/R` e `CTRL_hind_paw.L/R` definem onde cada pata pisa, `CTRL_hind_heel.L/R` levanta o calcanhar e `CTRL_hind_knee.L/R` aponta o joelho. `root` move o personagem inteiro.

**Animações.** No Action Editor, escolha uma ação no rig:

| Ação | Quadros | |
|---|---|---|
| `SB_Sentado_Idle` | 1–97 | respiração, cauda, orelha, piscada (ciclo) |
| `SB_Olhando_Lados` | 1–121 | cabeça e olhos varrem os lados (ciclo) |
| `SB_Andando` | 1–33 | caminhada no lugar (ciclo) |
| `SB_Correndo` | 1–15 | galope no lugar (ciclo) |
| `SB_Pulando` | 1–60 | agacha, salta para a frente, pousa |
| `SB_Deitado` | 1–97 | deitado de barriga, respirando (ciclo) |
| `SB_Dormindo` | 1–121 | enrolado, olhos fechados (ciclo) |
| `SB_Em_Pe` | 1 | pose em pé |
| `SB_Pendurado` | 1–73 | pendurado pelas patas dianteiras, balançando (ciclo) |
| `SB_Pendurado_Deslizando` | 1–17 | as patas escorregam e procuram apoio (ciclo) |
| `SB_Pendurado_UmaPata` | 1–41 | por uma pata, a outra tenta voltar (ciclo) |
| `SB_Escalando` | 1–21 | sobe mão sobre mão (ciclo) |
| `SB_Espiando` | 1–97 | queixo e patas numa borda (ciclo) |
| `SB_Caindo` | 1–13 | no ar, patas abertas (ciclo) |
| `SB_Pousando` | 1–24 | absorve o impacto e levanta |
| `SB_Espreguicando` | 1–52 | reverência e dorso arqueado |
| `SB_Curioso` | 1–97 | sentado, inclina a cabeça e olha em volta (ciclo) |

24 fps. As ações têm *fake user*, então não se perdem ao salvar.

**Câmeras.** `CAM_01_Frontal`, `02_Traseira`, `03_Lateral_Direita`, `04_Lateral_Esquerda`, `07_Superior` e `08_Inferior` são ortográficas. `05_3Q_Frontal` (câmera principal), `06_3Q_Traseira`, `09_Close_Rosto` e `10_Close_Olhos` são em perspectiva. As luzes foram pensadas para a câmera principal; para as outras vistas, gire `LIGHT_Rig` em Z (o script de render faz isso sozinho).

**Render.** O arquivo está em Cycles (CPU), 128 amostras com denoise. Os materiais são Principled BSDF comuns, então devem funcionar no EEVEE, mas só renderizei em Cycles (este ambiente não tem GPU).

## Reconstruir do zero

```bash
cd scripts
blender --background --python build_sr_bigodes.py          # gera ../SR_BIGODES.blend (~45 s)
blender --background --python render_sr_bigodes.py         # gera ../renders (use "-- draft" para um teste rápido)
python make_sheet.py                                        # monta a folha (precisa de Pillow)
```

Também roda sem o Blender instalado, com `pip install bpy pillow` e `python build_sr_bigodes.py`.

| Script | Faz |
|---|---|
| `sb_sdf.py` | campo de distância, extração da malha (surface nets), pesos de skinning. Só numpy. |
| `sb_model.py` | proporções, volumes, todas as peças e os materiais |
| `sb_rig.py` | armature, IK, vínculos, drivers |
| `sb_anim.py` | poses e animações |
| `sb_scene.py` | coleções, câmeras, luzes, ambiente |
| `build_sr_bigodes.py` | junta tudo e salva o `.blend` |
| `render_sr_bigodes.py` | renders de apresentação |
| `make_sheet.py` | folha de apresentação |
| `export_glb.py` | exporta o personagem para o site (`public/models/sr-bigodes.glb`): malhas com skin, materiais, morph targets e todas as ações; depois `npx @gltf-transform/cli meshopt` comprime |
| `render_turntable.py` | giro 360° para o Lab do portfólio: escreve o pôster e a folha de 36 quadros em `assets/media/` (depois rode `npm run images` na raiz) |

Para mudar proporções, edite os números no topo de `sb_model.py` (dicionário `J`, `build_field`, `EYE_R`, `ear_surface`) e reconstrua.

## Como foi construído

A pele não é uma montagem de esferas. Cabeça, pescoço, tronco, pernas e dedos são descritos como um campo de distância com uniões suaves, e a malha é extraída desse campo em quads, com cada vértice projetado de volta na superfície exata. Por isso as transições (bochecha e focinho, coxa e garupa, perna e pata) são contínuas. A superfície é cortada em dois objetos no pescoço, com bordas que coincidem vértice a vértice e normais herdadas da superfície original, então a emenda não aparece.

Os pesos de skinning saem dos próprios volumes: cada vértice pesa pelos ossos dos volumes que formam a superfície naquele ponto.

Orelhas, cauda, olhos, pálpebras, nariz, sobrancelhas e coxins são malhas paramétricas de baixa resolução com Subdivision Surface. Os bigodes são curvas NURBS com espessura.

## Limites conhecidos

- **Topologia.** A pele tem malha uniforme de quads vinda da extração, não loops de aresta desenhados à mão ao redor de olhos, boca e articulações. Deforma bem nas poses entregues, mas para produção de animação facial fina ou para jogo com orçamento de polígonos, o passo seguinte é uma retopologia manual.
- **Sem UVs e sem pelo.** Os materiais são procedurais. Não há mapa UV nem sistema de pelos; a pelagem é um material acetinado.
- **Boca.** É uma linha sobre o focinho e um interior que abre na expressão `Surpreso`. Não há mandíbula articulada, dentes nem língua.
- **Olhos fechados.** As pálpebras são cascas sobre o globo, então o olho fechado fica saliente.
- **Pose sentada.** O modelo é construído em pé; a pose sentada usa escala nos ossos do tronco e deslize da escápula para dar o formato de pera da referência. Poses muito diferentes das entregues podem pedir ajuste de pesos.
- **Animações.** São ciclos básicos gerados por código, um ponto de partida para polir à mão. `SB_Pulando` desloca o corpo para a frente sem mover o `root`.
- **Versão.** Só foi testado no Blender 5.3. Em versões anteriores, o caminho é rodar `build_sr_bigodes.py` na sua versão; não testei isso.
