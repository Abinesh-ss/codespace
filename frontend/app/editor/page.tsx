"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

import Layout from "@/components/Layout";

import {
  MapPin,
  Plus,
  Trash2,
  MousePointer,
  ArrowRight,
  Save,
  Loader2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";

/* -------------------------------- */
/* TYPES                            */
/* -------------------------------- */

interface POI {
  id: number;
  nodeId: string;
  name: string;
  type: string;
  x: number;
  y: number;
  floorId: string;
}

interface Route {
  id: number;
  from: string;
  to: string;
  distance: number;
  floorId: string;
}

interface MapData {
  id: string | number;
  name: string;
  url?: string;
  mapWidth?: number;
  mapHeight?: number;
}

interface Point {
  x: number;
  y: number;
}

/* -------------------------------- */
/* VALIDATION                       */
/* -------------------------------- */

function validateGraph(
  pois: POI[],
  routes: Route[]
) {
  const errors: string[] = [];

  const nodeIds = new Set<string>();

  for (const poi of pois) {
    if (nodeIds.has(poi.nodeId)) {
      errors.push(`Duplicate nodeId: ${poi.name}`);
    }

    nodeIds.add(poi.nodeId);
  }

  for (const route of routes) {
    const from = pois.find(
      (p) => p.nodeId === route.from
    );

    const to = pois.find(
      (p) => p.nodeId === route.to
    );

    if (!from || !to) {
      errors.push(
        "Route contains missing node"
      );
    }
  }

  return errors;
}

/* -------------------------------- */
/* PAGE                             */
/* -------------------------------- */

export default function Editor() {
  const router = useRouter();

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState<boolean | null>(null);

  const [
    hospitalId,
    setHospitalId,
  ] = useState<string | null>(null);

  const [
    selectedMap,
    setSelectedMap,
  ] = useState<MapData | null>(null);

  const [
    pointsOfInterest,
    setPointsOfInterest,
  ] = useState<POI[]>([]);

  const [routes, setRoutes] =
    useState<Route[]>([]);

  const [
    activeTool,
    setActiveTool,
  ] = useState("pointer");

  const [
    selectedPOI,
    setSelectedPOI,
  ] =
    useState<POI | null>(null);

  const [
    routeStartPOI,
    setRouteStartPOI,
  ] = useState<number | null>(null);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    activeFloor,
    setActiveFloor,
  ] = useState(1);

  /* -------------------------------- */
  /* MAP ENGINE                       */
  /* -------------------------------- */

  const [scale, setScale] =
    useState(1);

  const [offset, setOffset] =
    useState({
      x: 0,
      y: 0,
    });

  const [rotation, setRotation] =
    useState(0);

  const canvasRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const draggingPOIRef =
    useRef<POI | null>(null);

  const draggingMapRef =
    useRef(false);

  const lastMouseRef =
    useRef({
      x: 0,
      y: 0,
    });

  /* -------------------------------- */
  /* LOAD                             */
  /* -------------------------------- */

  useEffect(() => {
    const init = async () => {
      try {
        const authRes =
          await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/my`,
            {
              credentials:
                "include",
            }
          );

        if (!authRes.ok) {
          router.replace(
            "/login?redirect=/editor"
          );

          return;
        }

        const user =
          await authRes.json();

        setHospitalId(user.id);

        const params =
          new URLSearchParams(
            window.location.search
          );

        const mapId =
          params.get("mapId") ||
          crypto.randomUUID();

        const mapUrl =
          localStorage.getItem(
            "uploadedMapUrl"
          ) || "";

        const mapWidth =
          Number(
            localStorage.getItem(
              "uploadedMapWidth"
            )
          ) || 1200;

        const mapHeight =
          Number(
            localStorage.getItem(
              "uploadedMapHeight"
            )
          ) || 800;

        setSelectedMap({
          id: mapId,
          name:
            "Hospital Floor Plan",
          url: mapUrl,
          mapWidth,
          mapHeight,
        });

        const floorRes =
          await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/floor?hospitalId=${user.id}`,
            {
              credentials:
                "include",
            }
          );

        if (floorRes.ok) {
          const floors =
            await floorRes.json();

          const current =
            floors.find(
              (f: any) =>
                String(f.id) ===
                String(mapId)
            );

          if (current?.graphData) {
            const loadedPOIs =
              current.graphData
                .pointsOfInterest ||
              [];

            const loadedRoutes =
              current.graphData
                .routes || [];

            setPointsOfInterest(
              loadedPOIs
            );

            /* FILTER INVALID ROUTES */
            const validRoutes =
              loadedRoutes.filter(
                (route: Route) => {
                  const from =
                    loadedPOIs.find(
                      (p: POI) =>
                        p.nodeId ===
                        route.from
                    );

                  const to =
                    loadedPOIs.find(
                      (p: POI) =>
                        p.nodeId ===
                        route.to
                    );

                  return (
                    from && to
                  );
                }
              );

            setRoutes(validRoutes);

            if (
              current.graphData.scale
            ) {
              setScale(
                current.graphData.scale
              );
            }

            if (
              current.graphData.rotation
            ) {
              setRotation(
                current.graphData.rotation
              );
            }

            if (
              current.graphData.offsetX !==
                undefined &&
              current.graphData.offsetY !==
                undefined
            ) {
              setOffset({
                x: current.graphData.offsetX,
                y: current.graphData.offsetY,
              });
            }
          }
        }

        setIsAuthenticated(true);
      } catch (err) {
        console.error(err);

        setIsAuthenticated(false);
      }
    };

    init();
  }, [router]);

  /* -------------------------------- */
  /* SAVE                             */
  /* -------------------------------- */

  const handleSave = async () => {
    if (
      !hospitalId ||
      !selectedMap
    )
      return;

    const errors =
      validateGraph(
        pointsOfInterest,
        routes
      );

    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    setIsSaving(true);

    try {
      const res =
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/hospital/floor`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              hospitalId,

              mapId:
                selectedMap.id,

              name:
                selectedMap.name,

              level:
                activeFloor,

              graphData: {
                pointsOfInterest,
                routes,
                scale,
                rotation,
                offsetX:
                  offset.x,
                offsetY:
                  offset.y,
              },
            }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Save failed"
        );
      }

      alert(
        "Saved successfully"
      );
    } catch (err: any) {
      console.error(err);

      alert(
        err.message ||
          "Save failed"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------- */
  /* CANVAS CLICK                     */
  /* -------------------------------- */

  const handleCanvasClick = (
    e: React.MouseEvent
  ) => {
    if (activeTool !== "poi")
      return;

    if (!canvasRef.current)
      return;

    const rect =
      canvasRef.current.getBoundingClientRect();

    // 1. Get raw offsets from top-left of visual container
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // 2. Adjust for canvas translation offset
    const dx = rawX - offset.x;
    const dy = rawY - offset.y;

    // 3. Compensate for CSS transform rotation around top-left point
    const rad = (-rotation * Math.PI) / 180;
    const rotX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const rotY = dx * Math.sin(rad) + dy * Math.cos(rad);

    // 4. Divide out scale factor vector to find map local coordinate values
    const x = rotX / scale;
    const y = rotY / scale;

    const newPOI: POI = {
      id: Date.now(),
      nodeId:
        crypto.randomUUID(),
      name: `POI ${
        pointsOfInterest.length +
        1
      }`,
      type: "general",
      x,
      y,
      floorId: String(
        activeFloor
      ),
    };

    setPointsOfInterest(
      (prev) => [
        ...prev,
        newPOI,
      ]
    );

    setSelectedPOI(newPOI);
  };

  /* -------------------------------- */
  /* DRAG                             */
  /* -------------------------------- */

  const onMouseMove = (
    e: React.MouseEvent
  ) => {
    if (
      draggingPOIRef.current &&
      canvasRef.current
    ) {
      const rect =
        canvasRef.current.getBoundingClientRect();

      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      const dx = rawX - offset.x;
      const dy = rawY - offset.y;

      const rad = (-rotation * Math.PI) / 180;
      const rotX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const rotY = dx * Math.sin(rad) + dy * Math.cos(rad);

      const x = rotX / scale;
      const y = rotY / scale;

      setPointsOfInterest(
        (prev) =>
          prev.map((p) =>
            p.id ===
            draggingPOIRef
              .current?.id
              ? {
                  ...p,
                  x,
                  y,
                }
              : p
          )
      );
    }

    if (draggingMapRef.current) {
      const dx =
        e.clientX -
        lastMouseRef.current.x;

      const dy =
        e.clientY -
        lastMouseRef.current.y;

      setOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastMouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    }
  };

  /* -------------------------------- */
  /* ZOOM                             */
  /* -------------------------------- */

  const zoomIn = () =>
    setScale((s) =>
      Math.min(s + 0.1, 4)
    );

  const zoomOut = () =>
    setScale((s) =>
      Math.max(s - 0.1, 0.5)
    );

  /* -------------------------------- */
  /* FILTER                           */
  /* -------------------------------- */

  const visiblePOIs =
    useMemo(
      () =>
        pointsOfInterest.filter(
          (p) =>
            p.floorId ===
            String(activeFloor)
        ),
      [
        pointsOfInterest,
        activeFloor,
      ]
    );

  /* -------------------------------- */
  /* LOADING                          */
  /* -------------------------------- */

  if (
    isAuthenticated === null
  ) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  /* -------------------------------- */
  /* UI                               */
  /* -------------------------------- */

  return (
    <Layout showSidebar>
      <div className="flex flex-col h-screen bg-white">

        {/* HEADER */}
        <div className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">

          <div className="flex items-center gap-4">

            <h2 className="font-black tracking-tight uppercase text-gray-900">
              Hospital Map Editor
            </h2>

            <span className="text-gray-300">
              |
            </span>

            <span className="text-sm text-gray-500">
              {selectedMap?.name}
            </span>
          </div>

          <div className="flex items-center gap-3">

            <input
              type="number"
              value={activeFloor}
              onChange={(e) =>
                setActiveFloor(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-16 px-2 py-1 border rounded-lg text-center font-bold"
            />

            <button
              onClick={zoomIn}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={zoomOut}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                setRotation(
                  (r) => r + 90
                )
              }
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={
                handleSave
              }
              disabled={
                isSaving
              }
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}

              SAVE
            </button>
            <button
              onClick={() => {
                if (!hospitalId || !selectedMap?.id) return;

                router.push(
                  `/qr-generator?hospitalId=${hospitalId}&mapId=${selectedMap.id}`
                );
              }}
              className="flex items-center gap-2 px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-bold"
            >
              QR CODES
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">

          {/* TOOLS */}
          <div className="w-20 border-r bg-gray-50 flex flex-col items-center gap-6 py-8">

            <Tool
              icon={
                <MousePointer size={22} />
              }
              label="Pointer"
              active={
                activeTool ===
                "pointer"
              }
              onClick={() =>
                setActiveTool(
                  "pointer"
                )
              }
            />

            <Tool
              icon={
                <Plus size={22} />
              }
              label="POI"
              active={
                activeTool ===
                "poi"
              }
              onClick={() =>
                setActiveTool(
                  "poi"
                )
              }
            />

            <Tool
              icon={
                <ArrowRight size={22} />
              }
              label="Route"
              active={
                activeTool ===
                "route"
              }
              onClick={() =>
                setActiveTool(
                  "route"
                )
              }
            />

            <Tool
              icon={
                <Move size={22} />
              }
              label="Pan"
              active={
                activeTool ===
                "pan"
              }
              onClick={() =>
                setActiveTool(
                  "pan"
                )
              }
            />

            <Tool
              icon={
                <Trash2 size={22} />
              }
              label="Delete"
              active={
                activeTool ===
                "delete"
              }
              onClick={() =>
                setActiveTool(
                  "delete"
                )
              }
            />
          </div>

          {/* CANVAS */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">

            <div
              ref={canvasRef}
              onClick={
                handleCanvasClick
              }
              onMouseMove={
                onMouseMove
              }
              onMouseUp={() => {
                draggingPOIRef.current =
                  null;

                draggingMapRef.current =
                  false;
              }}
              onMouseDown={(e) => {
                if (
                  activeTool ===
                  "pan"
                ) {
                  draggingMapRef.current =
                    true;

                  lastMouseRef.current =
                    {
                      x:
                        e.clientX,
                      y:
                        e.clientY,
                    };
                }
              }}
              className="relative bg-white border rounded-2xl shadow-2xl overflow-hidden mx-auto"
              style={{
                width:
                  selectedMap?.mapWidth ||
                  1200,

                height:
                  selectedMap?.mapHeight ||
                  800,
              }}
            >

              {/* MAP */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `
                    translate(${offset.x}px, ${offset.y}px)
                    scale(${scale})
                    rotate(${rotation}deg)
                  `,
                  transformOrigin:
                    "top left",
                }}
              >

                {selectedMap?.url && (
                  <img
                    src={
                      selectedMap.url
                    }
                    alt="Map"
                    className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                    draggable={
                      false
                    }
                  />
                )}

                {/* ROUTES */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">

                  {routes.map(
                    (route) => {
                      const from =
                        pointsOfInterest.find(
                          (p) =>
                            p.nodeId ===
                            route.from
                        );

                      const to =
                        pointsOfInterest.find(
                          (p) =>
                            p.nodeId ===
                            route.to
                        );

                      if (
                        !from ||
                        !to
                      )
                        return null;

                      return (
                        <line
                          key={
                            route.id
                          }
                          x1={
                            from.x
                          }
                          y1={
                            from.y
                          }
                          x2={to.x}
                          y2={to.y}
                          stroke="#4f46e5"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      );
                    }
                  )}
                </svg>

                {/* POIS */}
                {visiblePOIs.map(
                  (poi) => (
                    <div
                      key={
                        poi.id
                      }
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                      style={{
                        left:
                          poi.x,
                        top:
                          poi.y,
                      }}
                      onMouseDown={(
                        e
                      ) => {
                        e.stopPropagation();

                        if (
                          activeTool ===
                          "pointer"
                        ) {
                          draggingPOIRef.current =
                            poi;
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();

                        if (
                          activeTool ===
                          "delete"
                        ) {
                          setPointsOfInterest(
                            (
                              prev
                            ) =>
                              prev.filter(
                                (
                                  p
                                ) =>
                                  p.id !==
                                  poi.id
                              )
                          );

                          /* REMOVE ROUTES ALSO */
                          setRoutes(
                            (
                              prev
                            ) =>
                              prev.filter(
                                (
                                  r
                                ) =>
                                  r.from !==
                                    poi.nodeId &&
                                  r.to !==
                                    poi.nodeId
                              )
                          );

                          return;
                        }

                        if (
                          activeTool ===
                          "route"
                        ) {
                          if (
                            routeStartPOI ===
                            null
                          ) {
                            setRouteStartPOI(
                              poi.id
                            );
                          } else {
                            const from =
                              pointsOfInterest.find(
                                (
                                  p
                                ) =>
                                  p.id ===
                                  routeStartPOI
                              );

                            if (
                              from &&
                              from.nodeId !==
                                poi.nodeId
                            ) {
                              setRoutes(
                                (
                                  prev
                                ) => [
                                  ...prev,

                                  {
                                    id:
                                      Date.now(),

                                    from:
                                      from.nodeId,

                                    to:
                                      poi.nodeId,

                                    distance:
                                      Math.round(
                                        Math.hypot(
                                          poi.x -
                                            from.x,

                                          poi.y -
                                            from.y
                                        )
                                      ),

                                    floorId:
                                      from.floorId,
                                  },
                                ]
                              );
                            }

                            setRouteStartPOI(
                              null
                            );
                          }

                          return;
                        }

                        setSelectedPOI(
                          poi
                        );
                      }}
                    >

                      {/* PIN */}
                      <div
                        className={`p-2 rounded-full border-2 shadow-lg transition-all ${
                          selectedPOI?.id ===
                          poi.id
                            ? "bg-green-500 border-white text-white scale-125"
                            : "bg-white border-gray-400 text-gray-700"
                        }`}
                      >
                        <MapPin
                          className="w-5 h-5"
                          fill="currentColor"
                          fillOpacity={
                            0.25
                          }
                        />
                      </div>

                      {/* NAME */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap px-2 py-1 rounded bg-gray-900/90 text-white text-[10px] font-bold uppercase">
                        {
                          poi.name
                        }
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-80 border-l bg-white p-6 overflow-y-auto">

            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
              Points Of Interest
            </h3>

            <div className="space-y-4">

              {pointsOfInterest.map(
                (poi) => (
                  <div
                    key={
                      poi.id
                    }
                    className={`p-4 rounded-xl border ${
                      selectedPOI?.id ===
                      poi.id
                        ? "border-green-400 bg-green-50"
                        : "border-gray-100"
                    }`}
                  >

                    {/* NAME */}
                    <input
                      value={
                        poi.name
                      }
                      onChange={(
                        e
                      ) =>
                        setPointsOfInterest(
                          (
                            prev
                          ) =>
                            prev.map(
                              (
                                p
                              ) =>
                                p.id ===
                                poi.id
                                  ? {
                                      ...p,
                                      name:
                                        e
                                          .target
                                          .value,
                                    }
                                  : p
                            )
                        )
                      }
                      placeholder="POI Name"
                      className="w-full font-bold text-sm outline-none border rounded-lg px-3 py-2"
                    />

                    {/* TYPE */}
                    <input
                      type="text"
                      value={
                        poi.type
                      }
                      onChange={(
                        e
                      ) =>
                        setPointsOfInterest(
                          (
                            prev
                          ) =>
                            prev.map(
                              (
                                p
                              ) =>
                                p.id ===
                                poi.id
                                  ? {
                                      ...p,
                                      type:
                                        e
                                          .target
                                          .value,
                                    }
                                  : p
                            )
                        )
                      }
                      placeholder="POI Type"
                      className="w-full mt-3 border rounded-lg px-3 py-2 text-xs"
                    />

                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* -------------------------------- */
/* TOOL BUTTON                      */
/* -------------------------------- */

function Tool({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;

  label: string;

  active: boolean;

  onClick: () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className={`group relative p-4 rounded-2xl transition-all ${
        active
          ? "bg-indigo-600 text-white scale-110 shadow-lg"
          : "text-gray-400 hover:bg-white hover:text-indigo-600"
      }`}
    >
      {icon}

      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap px-2 py-1 rounded bg-gray-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </button>
  );
}
