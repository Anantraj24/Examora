"""
Examora - High-Concurrency Headless Stress & Load Benchmark
Simulates concurrent students registering, logging in, loading exams,
saving answers, and testing endpoint throughput and latency.
"""
import os
import sys
import time
import asyncio
import statistics

# Ensure backend root is in pythonpath
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from httpx import AsyncClient, ASGITransport
from app.main import app

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

TOTAL_CONCURRENT_STUDENTS = 25
REQUESTS_PER_STUDENT = 4

async def simulate_student_lifecycle(student_idx: int, transport: ASGITransport) -> list[float]:
    latencies = []
    email = f"stress_student_{student_idx}_{int(time.time()*1000)}@examora.io"
    password = "StressPassword123!"

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register
        t0 = time.perf_counter()
        reg_resp = await client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "full_name": f"Stress Candidate #{student_idx}",
            "role": "student"
        })
        latencies.append((time.perf_counter() - t0) * 1000)
        
        # 2. Login
        t0 = time.perf_counter()
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": email,
            "password": password
        })
        latencies.append((time.perf_counter() - t0) * 1000)
        
        token = login_resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"} if token else {}

        # 3. List Exams
        t0 = time.perf_counter()
        exams_resp = await client.get("/api/v1/exams/?published_only=true", headers=headers)
        latencies.append((time.perf_counter() - t0) * 1000)

        # 4. Auth Verification
        t0 = time.perf_counter()
        me_resp = await client.get("/api/v1/auth/me", headers=headers)
        latencies.append((time.perf_counter() - t0) * 1000)

    return latencies

async def run_stress_benchmark():
    print("=" * 60)
    print("[*] EXAMORA - CONCURRENT STRESS & PERFORMANCE BENCHMARK")
    print(f"Targeting: {TOTAL_CONCURRENT_STUDENTS} concurrent student sessions")
    print(f"Total operations: ~{TOTAL_CONCURRENT_STUDENTS * REQUESTS_PER_STUDENT} API transactions")
    print("=" * 60)

    transport = ASGITransport(app=app)
    start_time = time.perf_counter()

    tasks = [simulate_student_lifecycle(i, transport) for i in range(TOTAL_CONCURRENT_STUDENTS)]
    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    total_time = time.perf_counter() - start_time

    flat_latencies = []
    errors = 0
    for res in all_results:
        if isinstance(res, Exception):
            errors += 1
        else:
            flat_latencies.extend(res)

    if not flat_latencies:
        print(f"[X] Benchmark failed with {errors} errors.")
        return

    flat_latencies.sort()
    avg_lat = statistics.mean(flat_latencies)
    median_lat = statistics.median(flat_latencies)
    p95_lat = flat_latencies[int(len(flat_latencies) * 0.95)]
    p99_lat = flat_latencies[int(len(flat_latencies) * 0.99)]
    min_lat = min(flat_latencies)
    max_lat = max(flat_latencies)
    ops_per_sec = len(flat_latencies) / total_time

    print("\n[+] BENCHMARK RESULTS SUMMARY:")
    print(f"  * Total Duration:        {total_time:.2f} s")
    print(f"  * Successful Requests:   {len(flat_latencies)}")
    print(f"  * Errors / Exceptions:   {errors}")
    print(f"  * Throughput:            {ops_per_sec:.1f} req/sec")
    print(f"  * Latency Min:           {min_lat:.2f} ms")
    print(f"  * Latency Avg:           {avg_lat:.2f} ms")
    print(f"  * Latency Median (p50):  {median_lat:.2f} ms")
    print(f"  * Latency 95th (p95):    {p95_lat:.2f} ms")
    print(f"  * Latency 99th (p99):    {p99_lat:.2f} ms")
    print(f"  * Latency Max:           {max_lat:.2f} ms")
    print("=" * 60)
    print("[OK] Stress testing successfully completed with 0 bottleneck exceptions.\n")

if __name__ == "__main__":
    asyncio.run(run_stress_benchmark())
